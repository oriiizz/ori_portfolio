/**
 * Portfolio 文案与路由 — 封面由 contentConfig.getCoverUrl(id) 解析；可选 `youtubeId` 见 contentConfig 顶部说明。
 * 球面第几格用哪个 id 由 orbFaceOrder.js 的 ORB_FACE_ORDER 决定，不必与下方 projects 数组顺序一致。
 */
export const portfolioData = {
  site: {
    heroTitle: 'Xunan Zheng',
    heroSubtitle: 'seek freedom passionately',
    tagline: 'Cross-media designer',
  },
  aboutOrbCard: {
    aboutCard: true,
    title: 'About',
    description: '自述與聯絡',
    link: '/about',
    /** 预留：若以后 About 浮层要嵌 YouTube，填 id 或完整链接；空字符串表示不用 */
    youtubeId: '',
  },
  aboutDetail: {
    paragraphs: [
      '我是 Ori，一名跨媒介设计与多媒体方向的创作者，关注空间、身体与叙事之间的张力。作品常游走于装置、表演与数字影像之间，试图在克制与偶然之间找到情绪的节奏。',
      '我相信「手稿感」与「未完成性」同样是作品的一部分：留白、颗粒与光的痕迹，都是观者与作品共同完成的意义。',
    ],
    education: [
      {
        school: 'The Hong Kong Polytechnic University, Hong Kong, China',
        range: '09/2025 – 03/2027',
        lines: ['MSc Innovative Multimedia and Entertainment (Research Stream)'],
      },
      {
        school: 'Beijing Forestry University, Beijing, China',
        range: '09/2020 – 06/2024',
        lines: ['BFA Digital Media Art', 'GPA 3.58 / 4.00'],
      },
    ],
  },
  contact: {
    email: '25049827g@connect.polyu.hk',
    social: [],
  },
  projects: [
    {
      id: 'p1',
      /** 详情页主视频：有则嵌 YouTube，并隐藏文件夹内 video.mp4（可填完整 youtu.be 链接） */
      youtubeId: 'https://youtu.be/rKjEjDxMEYU',
      title: 'The Silent Seconds Murder Case Z-CS-SI-2024-001-Y',
      titleEn: '',
      tags: ['Performance Installation'],
      to: '/project/p1',
      footerCredit: '© Portfolio · The Silent Seconds Murder Case · Ambiguity and truth',
      openingParagraphs: [
        "With the rapid development of technology and the widespread embedding of algorithms, gamification mechanisms and reward systems have gradually permeated everyday life. Behind ostensibly harmless clicks and interactions, their operative logic is often to enlist attention and induce the unconscious expenditure of time and energy through finely calibrated affordances. The implicit consumption they produce is at once covert and corrosive, diffuse in its effects, difficult to name, and easily overlooked.",
        "Through visual staging and a one-time performance, this installation traces how such consumption accumulates until control gives way. Conceived as singular and irreversible—the apparatus is dismantled once the act concludes—it figures the irreversibility of a life balance once it has been broken, consolidating the work's conceptual claim.",
      ],
      closingParagraphs: [
        "In this project, I employed two diametrically opposed logics for creation. While constructing the installation, I adopted the logic of a 'perpetrator,' meticulously building a sophisticated 'crime scene.' Conversely, during the editing and layout process, I transitioned to the logic of a 'detective,' guiding the audience to gradually uncover the truth through scattered clues. This dual-logic approach not only serves as a vital pillar of the project's content but also presented a significant innovation and challenge to my way of thinking.",
        "On one hand, I aim to analyze how these precision mechanisms control and deplete human behavior through this work; on the other hand, I realize that in the creative process, I am also 'controlling' the audience's experience through precise logic. This dual relationship of 'controlling vs. being controlled' and 'consuming vs. being consumed' is the core expression of this project, intended to provoke profound reflection on the behavioral logic of the digital age.",
      ],
    },
    {
      id: 'p2',
      youtubeId: '',
      title: 'Project Two',
      titleEn: '',
      tags: ['Branding', 'Visual'],
      to: '/project/p2',
    },
    {
      id: 'p3',
      youtubeId: '',
      title: 'Project Three',
      titleEn: '',
      tags: ['Interaction', 'Web'],
      to: '/project/p3',
    },
    {
      id: 'p4',
      youtubeId: '',
      title: 'Project Four',
      titleEn: '',
      tags: ['3D', 'Rendering'],
      to: '/project/p4',
    },
    {
      id: 'p5',
      youtubeId: '',
      title: 'Project Five',
      titleEn: '',
      tags: ['Video', 'Editing'],
      to: '/project/p5',
    },
    {
      id: 'p6',
      youtubeId: '',
      title: 'Project Six',
      titleEn: '',
      tags: ['Illustration', 'Print'],
      to: '/project/p6',
    },
    {
      id: 'p7',
      youtubeId: '',
      title: 'Project Seven',
      titleEn: '',
      tags: ['Installation', 'Spatial'],
      to: '/project/p7',
    },
    {
      id: 'p8',
      youtubeId: '',
      title: 'Project Eight',
      titleEn: '',
      tags: ['Experimental', 'Mixed Media'],
      to: '/project/p8',
    },
  ],
}
