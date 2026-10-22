import { sitePath } from '../lib/paths';

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audio: string;
  lyrics: string;
  cover: string;
  demo?: boolean;
}

// 按数组顺序循环。稳定的 id 用于记住曲目，替换歌曲时请使用新的 id。
// 使用官方公开外链；不保存会过期的 CDN 跳转地址。来源及维护说明见 music.README.md。
export const musicTracks: MusicTrack[] = [
  {
    id: 'netease-31445772', title: '理想三旬', artist: '陈鸿宇',
    audio: 'https://music.163.com/song/media/outer/url?id=31445772.mp3',
    lyrics: sitePath('/music/lixiang-sanxun.lrc'),
    cover: 'https://p1.music.126.net/ryk8Gu64rOhlYn0pc2Q8Ww==/109951168090271827.jpg',
  },
  {
    id: 'netease-1336856864', title: '形容', artist: '沈以诚',
    audio: 'https://music.163.com/song/media/outer/url?id=1336856864.mp3',
    lyrics: sitePath('/music/xingrong.lrc'),
    cover: 'https://p1.music.126.net/1iLwRvMtUMYLZUNR-HQW7Q==/109951163957708692.jpg',
  },
  {
    id: 'netease-33894274', title: 'Heaven', artist: 'Ailee',
    audio: 'https://music.163.com/song/media/outer/url?id=33894274.mp3',
    lyrics: sitePath('/music/netease-33894274.lrc'),
    cover: 'https://p1.music.126.net/rZRbsTOizGEUzqedtSVNAg==/5888984278537559.jpg',
  },
  {
    id: 'netease-26550057', title: '你把我灌醉', artist: 'G.E.M.邓紫棋',
    audio: 'https://music.163.com/song/media/outer/url?id=26550057.mp3',
    lyrics: sitePath('/music/netease-26550057.lrc'),
    cover: 'https://p2.music.126.net/fqleir2BWqbmE8tDNLa5Pg==/109951163789160762.jpg',
  },
  {
    id: 'netease-26226510', title: 'Catch My Breath', artist: 'Kelly Clarkson',
    audio: 'https://music.163.com/song/media/outer/url?id=26226510.mp3',
    lyrics: sitePath('/music/netease-26226510.lrc'),
    cover: 'https://p1.music.126.net/lqUJW4EkNk-ldB9Y5j0mHw==/2385940232315172.jpg',
  },
  {
    id: 'netease-1330348068', title: '起风了', artist: '冯沁苑(买辣椒也用券)',
    audio: 'https://music.163.com/song/media/outer/url?id=1330348068.mp3',
    lyrics: sitePath('/music/netease-1330348068.lrc'),
    cover: 'https://p1.music.126.net/diGAyEmpymX8G7JcnElncQ==/109951163699673355.jpg',
  },
  {
    id: 'netease-5260328', title: '必杀技', artist: '古巨基',
    audio: 'https://music.163.com/song/media/outer/url?id=5260328.mp3',
    lyrics: sitePath('/music/netease-5260328.lrc'),
    cover: 'https://p2.music.126.net/Oix4KKx3qsuL8UGiLKcDiA==/43980465127856.jpg',
  },
  {
    id: 'netease-5255640', title: '黄昏', artist: '周传雄',
    audio: 'https://music.163.com/song/media/outer/url?id=5255640.mp3',
    lyrics: sitePath('/music/netease-5255640.lrc'),
    cover: 'https://p2.music.126.net/QoYAmdyE7FL_vc9rwNeS9w==/64871186055842.jpg',
  },
  {
    id: 'netease-27646205', title: '安和桥', artist: '宋冬野',
    audio: 'https://music.163.com/song/media/outer/url?id=27646205.mp3',
    lyrics: sitePath('/music/netease-27646205.lrc'),
    cover: 'https://p1.music.126.net/B8XyAbneWgxRcD95SGMBbA==/109951173825645527.jpg',
  },
  {
    id: 'netease-465921195', title: '还是分开', artist: '张叶蕾',
    audio: 'https://music.163.com/song/media/outer/url?id=465921195.mp3',
    lyrics: sitePath('/music/netease-465921195.lrc'),
    cover: 'https://p1.music.126.net/tH5FdakJX47uy8mlM0GMWQ==/19218363741925314.jpg',
  },
  {
    id: 'netease-191248', title: '明天过后', artist: '张杰',
    audio: 'https://music.163.com/song/media/outer/url?id=191248.mp3',
    lyrics: sitePath('/music/netease-191248.lrc'),
    cover: 'https://p1.music.126.net/2sgebzI7I7UW7GATOOOfgw==/109951173981889406.jpg',
  },
  {
    id: 'netease-5238992', title: '偏爱', artist: '张芸京',
    audio: 'https://music.163.com/song/media/outer/url?id=5238992.mp3',
    lyrics: sitePath('/music/netease-5238992.lrc'),
    cover: 'https://p1.music.126.net/L-7tS-3YBuh558I8OYbA3g==/6667438510890774.jpg',
  },
  {
    id: 'netease-1857630559', title: 'New Boy (Live)', artist: '房东的猫、陈婧霏',
    audio: 'https://music.163.com/song/media/outer/url?id=1857630559.mp3',
    lyrics: sitePath('/music/netease-1857630559.lrc'),
    cover: 'https://p2.music.126.net/KkrcSwKbRsd8GuaOHILlxA==/109951166077317301.jpg',
  },
  {
    id: 'netease-5257269', title: '好姑娘', artist: '李晓杰',
    audio: 'https://music.163.com/song/media/outer/url?id=5257269.mp3',
    lyrics: sitePath('/music/netease-5257269.lrc'),
    cover: 'https://p2.music.126.net/gUiv3RmgisNbwRltj1BymQ==/95657511633763.jpg',
  },
  {
    id: 'netease-486194136', title: '不为谁而作的歌 (Live)', artist: '林俊杰',
    audio: 'https://music.163.com/song/media/outer/url?id=486194136.mp3',
    lyrics: sitePath('/music/netease-486194136.lrc'),
    cover: 'https://p1.music.126.net/XHGzoVmS6SDep4VuHi5OjA==/18832435162500729.jpg',
  },
  {
    id: 'netease-4876355', title: '至少还有你', artist: '林忆莲',
    audio: 'https://music.163.com/song/media/outer/url?id=4876355.mp3',
    lyrics: sitePath('/music/netease-4876355.lrc'),
    cover: 'https://p1.music.126.net/kT_sx9eTWNHBpzwLuXr5-g==/109951163382064411.jpg',
  },
  {
    id: 'netease-2030549629', title: '姑娘在远方', artist: '柯柯柯啊',
    audio: 'https://music.163.com/song/media/outer/url?id=2030549629.mp3',
    lyrics: sitePath('/music/netease-2030549629.lrc'),
    cover: 'https://p1.music.126.net/mv4auWTJDt0qvt16GIJCHg==/109951168471922228.jpg',
  },
  {
    id: 'netease-475479888', title: '在你的身边', artist: '盛哲',
    audio: 'https://music.163.com/song/media/outer/url?id=475479888.mp3',
    lyrics: sitePath('/music/netease-475479888.lrc'),
    cover: 'https://p2.music.126.net/AYNBdRxJ8EdZo4xFjp7b4Q==/109951163191178425.jpg',
  },
  {
    id: 'netease-25638340', title: '此生不换', artist: '青鸟飞鱼',
    audio: 'https://music.163.com/song/media/outer/url?id=25638340.mp3',
    lyrics: sitePath('/music/netease-25638340.lrc'),
    cover: 'https://p1.music.126.net/UyDVlWWgOn8p8U8uQ_I1xQ==/7934075907687518.jpg',
  },
  {
    id: 'netease-478303470', title: '心做し', artist: '双笙（陈元汐）',
    audio: 'https://music.163.com/song/media/outer/url?id=478303470.mp3',
    lyrics: sitePath('/music/netease-478303470.lrc'),
    cover: 'https://p1.music.126.net/4m79yXLdqFt_0mbx9DjsoA==/109951166279817646.jpg',
  },
  {
    id: 'netease-1818819577', title: '我用什么把你留住', artist: '福禄寿FloruitShow',
    audio: 'https://music.163.com/song/media/outer/url?id=1818819577.mp3',
    lyrics: sitePath('/music/netease-1818819577.lrc'),
    cover: 'https://p1.music.126.net/OYhP32O2KQfgX_im1gIvgg==/109951165710244988.jpg',
  },
  {
    id: 'netease-1355925216', title: '山楂树の恋（cover大能人）', artist: '程佳佳',
    audio: 'https://music.163.com/song/media/outer/url?id=1355925216.mp3',
    lyrics: sitePath('/music/netease-1355925216.lrc'),
    cover: 'https://p1.music.126.net/s4tPgPlJZWL_15LpHTzggw==/109951163967887742.jpg',
  },
  {
    id: 'netease-506196018', title: 'Legends Never Die', artist: '英雄联盟、Against the Current',
    audio: 'https://music.163.com/song/media/outer/url?id=506196018.mp3',
    lyrics: sitePath('/music/netease-506196018.lrc'),
    cover: 'https://p2.music.126.net/XadmwVrMvDDdPr_Wve0dCw==/109951170930231334.jpg',
  },
  {
    id: 'netease-1461579206', title: 'Remember Our Summer (Future Bounce VIP)', artist: 'FrogMonster 蛙蛙',
    audio: 'https://music.163.com/song/media/outer/url?id=1461579206.mp3',
    lyrics: sitePath('/music/netease-1461579206.lrc'),
    cover: 'https://p1.music.126.net/kAML6bwkaUOjGXrCfTtuJQ==/109951173628289965.jpg',
  },
  {
    id: 'netease-34200629', title: '遇见 (Live)', artist: '孙燕姿',
    audio: 'https://music.163.com/song/media/outer/url?id=34200629.mp3',
    lyrics: sitePath('/music/netease-34200629.lrc'),
    cover: 'https://p2.music.126.net/0BzbHjZTdW8zcbgWAnzS7Q==/7931876884848881.jpg',
  },
  {
    id: 'netease-2068201075', title: '西楼别序 (现场合唱版)', artist: '尹昔眠、小田音乐社',
    audio: 'https://music.163.com/song/media/outer/url?id=2068201075.mp3',
    lyrics: sitePath('/music/netease-2068201075.lrc'),
    cover: 'https://p1.music.126.net/Ku-60DQmJERfCCD1a-4-SA==/109951168773069457.jpg',
  },
  {
    id: 'netease-30039341', title: '特别的人 (Live)', artist: '方大同',
    audio: 'https://music.163.com/song/media/outer/url?id=30039341.mp3',
    lyrics: sitePath('/music/netease-30039341.lrc'),
    cover: 'https://p1.music.126.net/ynp93ACzk4rhL-T_KccDFQ==/2531075770073370.jpg',
  },
  {
    id: 'netease-108765', title: '一千年以后 (Live)', artist: '林俊杰',
    audio: 'https://music.163.com/song/media/outer/url?id=108765.mp3',
    lyrics: sitePath('/music/netease-108765.lrc'),
    cover: 'https://p1.music.126.net/n71Alfj8GOuIYjfhJnfB7A==/109951171387075468.jpg',
  },
  {
    id: 'netease-108779', title: '江南 (Live)', artist: '林俊杰',
    audio: 'https://music.163.com/song/media/outer/url?id=108779.mp3',
    lyrics: sitePath('/music/netease-108779.lrc'),
    cover: 'https://p1.music.126.net/n71Alfj8GOuIYjfhJnfB7A==/109951171387075468.jpg',
  },
  {
    id: 'netease-3348607641', title: '一程山路 (Live)', artist: '毛不易',
    audio: 'https://music.163.com/song/media/outer/url?id=3348607641.mp3',
    lyrics: sitePath('/music/netease-3348607641.lrc'),
    cover: 'https://p1.music.126.net/fSXKUX0xWObnqud0-Zybyg==/109951172724048474.jpg',
  },
  {
    id: 'netease-3348608401', title: '呓语 (Live)', artist: '毛不易',
    audio: 'https://music.163.com/song/media/outer/url?id=3348608401.mp3',
    lyrics: sitePath('/music/netease-3348608401.lrc'),
    cover: 'https://p1.music.126.net/fSXKUX0xWObnqud0-Zybyg==/109951172724048474.jpg',
  },
  {
    id: 'netease-28952154', title: 'God is A Girl (Chillout Version)', artist: 'Groove Coverage',
    audio: 'https://music.163.com/song/media/outer/url?id=28952154.mp3',
    lyrics: sitePath('/music/netease-28952154.lrc'),
    cover: 'https://p2.music.126.net/R22YAdk0TD4EvttrWsV-1Q==/8888451999281894.jpg',
  },
  {
    id: 'netease-386844', title: '杀死那个石家庄人', artist: '万能青年旅店',
    audio: 'https://music.163.com/song/media/outer/url?id=386844.mp3',
    lyrics: sitePath('/music/netease-386844.lrc'),
    cover: 'https://p2.music.126.net/W1kczDCB4-r-uNAznD1ljg==/108851651165850.jpg',
  },
];
