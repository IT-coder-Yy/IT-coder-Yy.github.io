---
title: "从 Tool Schema 到安全执行器：Agent 工具系统的完整链路"
description: "沿着模型提出 Tool Call、Registry 查找、结构与业务校验、同步异步执行、统一 ToolResult 和结果回传的完整链路，解释如何把模型建议限制在可审计的执行边界内。"
publishedAt: 2026-07-28
category: "Agent 工程"
tags:
  - Tool Calling
  - JSON Schema
  - Pydantic
  - Agent 安全
  - Python
draft: false
featured: true
---

工具调用最重要的事实是：模型只提出调用建议，真正执行函数的是应用程序。

如果把模型返回的工具名和参数直接交给系统执行，那么 Tool Calling 只是把自然语言风险换成了结构化风险。完整工具系统还需要注册、查找、分层校验、权限、超时、结果归一化和循环控制。

```text
工具定义
→ Schema 暴露给模型
→ 模型返回 Tool Call
→ Registry 查找
→ 结构校验
→ 权限与业务校验
→ 执行器运行
→ ToolResult
→ 回传 Agent Loop
```

## Tool Schema 是能力契约，不是权限

Schema 应描述工具名称、职责和参数约束。JSON Schema 可以表达对象属性、必填字段、枚举和是否允许额外字段。[JSON Schema 对象参考](https://json-schema.org/understanding-json-schema/reference/object)

```json
{
  "name": "quote_shipping",
  "description": "根据起点、终点和重量计算候选报价，不创建订单",
  "parameters": {
    "type": "object",
    "properties": {
      "origin": { "type": "string", "minLength": 1 },
      "destination": { "type": "string", "minLength": 1 },
      "weight_kg": { "type": "number", "exclusiveMinimum": 0, "maximum": 50000 },
      "service": { "type": "string", "enum": ["standard", "express"] }
    },
    "required": ["origin", "destination", "weight_kg", "service"],
    "additionalProperties": false
  }
}
```

好的描述要说明“什么时候用”和“不会做什么”。这里明确工具只查询报价，不创建订单，可以减少模型在相近工具之间的误选。

但 Schema 不是授权系统。即使参数完全符合 Schema，当前用户也可能没有访问某个账户、路径或订单的权限。

## Registry 把模型限制在已注册能力中

执行器不能按模型返回的字符串进行动态导入或反射任意系统函数。Registry 只保存应用明确注册的工具。

```python
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any


ToolFunction = Callable[..., Any | Awaitable[Any]]


@dataclass(frozen=True)
class RegisteredTool:
    name: str
    function: ToolFunction
    args_model: type
    timeout_seconds: float


REGISTRY: dict[str, RegisteredTool] = {}


def register_tool(tool: RegisteredTool) -> None:
    if tool.name in REGISTRY:
        raise ValueError(f"duplicate tool: {tool.name}")
    REGISTRY[tool.name] = tool
```

模型请求不存在的工具时，系统应返回可理解的结构化错误，而不是尝试“猜一个最接近的函数”。

## 校验至少分三层

### 1. JSON 语法

先确认参数能够被解析为 JSON。解析失败只能说明格式不合法。

### 2. 结构校验

Pydantic 可以检查类型、范围、枚举和多余字段。默认模式可能进行类型转换；对于工具执行边界，可以根据需要启用 strict mode，让错误类型直接失败。[Pydantic Strict Mode](https://pydantic.dev/docs/validation/latest/concepts/strict_mode/)

```python
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field


class QuoteArgs(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    origin: str = Field(min_length=1, max_length=80)
    destination: str = Field(min_length=1, max_length=80)
    weight_kg: float = Field(gt=0, le=50_000)
    service: Literal["standard", "express"]
```

### 3. 业务与权限校验

结构正确不代表操作允许。还要检查：

- 当前身份是否有权调用；
- 资源是否属于当前用户或租户；
- 文件路径是否落在允许目录；
- 状态是否满足操作前置条件；
- 金额、时间和次数是否在业务限制内；
- 写入操作是否已经获得确认。

这层应由确定性代码完成，不能让同一个模型既提出操作又自行批准。

## 执行器统一同步、异步与超时

下面是独立的最小示例。它展示执行边界，不包含认证、审计存储和分布式任务能力。

```python
import asyncio
import inspect
import json
from dataclasses import asdict, dataclass
from typing import Any
from pydantic import ValidationError


@dataclass
class ToolResult:
    ok: bool
    tool: str
    data: Any = None
    error_code: str | None = None
    message: str | None = None


async def execute_tool(name: str, raw_arguments: str) -> ToolResult:
    tool = REGISTRY.get(name)
    if tool is None:
        return ToolResult(False, name, error_code="tool_not_found")

    try:
        payload = json.loads(raw_arguments)
        arguments = tool.args_model.model_validate(payload)
        check_permission_and_business_rules(name, arguments)
    except json.JSONDecodeError as error:
        return ToolResult(False, name, error_code="invalid_json", message=str(error))
    except ValidationError as error:
        return ToolResult(False, name, error_code="invalid_arguments", message=str(error))
    except PermissionError as error:
        return ToolResult(False, name, error_code="permission_denied", message=str(error))

    async def invoke() -> Any:
        value = tool.function(**arguments.model_dump())
        return await value if inspect.isawaitable(value) else value

    try:
        data = await asyncio.wait_for(invoke(), timeout=tool.timeout_seconds)
        return ToolResult(True, name, data=data)
    except TimeoutError:
        return ToolResult(False, name, error_code="timeout")
    except Exception:
        log_exception_without_secrets(name)
        return ToolResult(False, name, error_code="execution_failed")
```

Python 的 `asyncio.wait_for()` 会在超时后取消等待中的任务；真实工具还应处理底层客户端是否支持取消、连接是否需要关闭，以及副作用是否已经发生。[Python asyncio tasks](https://docs.python.org/3/library/asyncio-task.html#asyncio.wait_for)

错误结果不应把密钥、完整响应或内部堆栈原样交给模型。日志可以保留受控诊断信息，模型只获得足以修正参数或决定停止的摘要。

## ToolResult 让上层不再猜格式

不同工具可能返回列表、对象或文本，但执行状态应统一。常用字段包括：

| 字段 | 含义 |
| --- | --- |
| `ok` | 是否成功完成工具语义 |
| `tool` | 实际执行的注册工具 |
| `data` | 经脱敏和裁剪的业务结果 |
| `error_code` | 稳定、可分支的错误码 |
| `message` | 面向 Agent 或用户的安全说明 |

不要用“HTTP 200”代替业务成功。外部接口返回成功响应，但数据为空、已经过期或违反业务约束时，ToolResult 仍应表达失败或不完整状态。

## 结果如何回到 Agent Loop

执行器把 ToolResult 作为工具消息写回对话或状态。Agent Loop 再判断：

1. 当前任务是否已经完成；
2. 是否需要其他独立工具；
3. 参数错误是否允许一次修正；
4. 外部依赖失败是否进入 fallback；
5. 是否达到最大步数和总超时。

并行工具只能用于相互独立的调用。若工具 B 依赖工具 A 的订单号，就必须等待 A 完成并校验后再执行 B。

## 副作用工具需要额外边界

查询天气和删除文件不应共享同一安全等级。对写入、发送、支付、删除和权限修改类工具，至少增加：

- 操作预览与人工确认；
- 幂等键，防止重试造成重复副作用；
- 最小权限凭据；
- 目标资源白名单或租户隔离；
- 审计日志与请求 ID；
- 明确的可撤销或补偿方案。

模型输出“用户已经同意”不构成确认。确认状态必须来自受信任的应用状态。

## 防止循环和无效重试

记录最近的 `(tool, normalized_arguments, result_summary)`。连续出现相同调用与相同结果时，应停止机械重试并触发重规划或 fallback。

同时设置：

- 单工具最大调用次数；
- Agent 最大总步数；
- 单工具超时与任务总超时；
- 允许重试的错误码；
- 退避策略；
- 无新信息时的停止条件。

可靠工具系统的目标不是保证模型永远选对，而是让选错、参数错误和外部故障都只能沿着受控路径传播。

