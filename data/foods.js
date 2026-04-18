// 美食数据 - 使用本地渐变色+Emoji替代外部图片
const foods = [
  {
    id: 1,
    name: '红烧肉',
    brief: '肥而不腻、色泽红亮的经典家常菜',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '中等',
    time: '90分钟',
    icon: '🥩',
    bgStyle: 'linear-gradient(135deg, #ff6b35, #d63031)',
    ingredients: [
      { name: '五花肉', amount: '500g' },
      { name: '冰糖', amount: '30g' },
      { name: '生抽', amount: '2勺' },
      { name: '老抽', amount: '1勺' },
      { name: '料酒', amount: '2勺' },
      { name: '葱姜', amount: '适量' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1小块' }
    ],
    steps: [
      { title: '准备食材', desc: '五花肉切成3cm见方的块，冷水下锅焯水去血沫，捞出沥干备用。' },
      { title: '炒糖色', desc: '锅中放少许油，加入冰糖小火炒化，炒至枣红色冒泡时放入肉块翻炒上色。' },
      { title: '调味炖煮', desc: '加入葱段、姜片、八角、桂皮爆香，倒入生抽、老抽、料酒翻炒均匀。' },
      { title: '焖制', desc: '加入开水没过肉块，大火烧开后转小火慢炖60分钟。' },
      { title: '收汁出锅', desc: '开大火收汁至浓稠，撒葱花即可装盘享用。' }
    ]
  },
  {
    id: 2,
    name: '麻婆豆腐',
    brief: '麻辣鲜香、嫩滑入味的川菜经典',
    category: '素菜',
    catClass: 'vege',
    difficulty: '简单',
    time: '20分钟',
    icon: '🌶️',
    bgStyle: 'linear-gradient(135deg, #e17055, #d63031)',
    ingredients: [
      { name: '嫩豆腐', amount: '1块(400g)' },
      { name: '牛肉末', amount: '100g' },
      { name: '豆瓣酱', amount: '2勺' },
      { name: '花椒粉', amount: '适量' },
      { name: '辣椒粉', amount: '适量' },
      { name: '蒜末', amount: '适量' },
      { name: '淀粉水', amount: '少许' },
      { name: '葱花', amount: '适量' }
    ],
    steps: [
      { title: '处理豆腐', desc: '豆腐切成2cm见方的小块，放入加盐的沸水中焯烫1分钟，捞出沥水备用。' },
      { title: '炒肉末', desc: '锅中热油，下牛肉末炒散炒酥，盛出备用。' },
      { title: '炒香料', desc: '锅底留油，小火炒香豆瓣酱、蒜末出红油。' },
      { title: '烧豆腐', desc: '加入适量清水或高汤烧开，放入豆腐块轻推均匀，中火煮5分钟入味。' },
      { title: '勾芡出锅', desc: '淋入淀粉水勾芡，撒上花椒粉、辣椒粉和葱花即可。' }
    ]
  },
  {
    id: 3,
    name: '宫保鸡丁',
    brief: '酸甜微辣、花生脆嫩的国民菜品',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '简单',
    time: '25分钟',
    icon: '🍗',
    bgStyle: 'linear-gradient(135deg, #fdcb6e, #e17055)',
    ingredients: [
      { name: '鸡胸肉', amount: '300g' },
      { name: '油炸花生米', amount: '50g' },
      { name: '干辣椒', amount: '8个' },
      { name: '花椒', amount: '1小把' },
      { name: '葱白', amount: '2段' },
      { name: '蒜瓣', amount: '3粒' },
      { name: '生抽', amount: '2勺' },
      { name: '醋', amount: '1勺' },
      { name: '白糖', amount: '1勺' }
    ],
    steps: [
      { title: '腌制鸡肉', desc: '鸡胸肉切丁，加少量盐、生抽、料酒和淀粉抓匀腌制15分钟。' },
      { title: '调碗汁', desc: '碗中混合生抽、醋、白糖、淀粉和适量清水调成调味汁备用。' },
      { title: '滑炒鸡丁', desc: '锅中多放油，油温六成热时下鸡丁滑炒至变色，盛出备用。' },
      { title: '爆炒香料', desc: '锅底留油，小火炸香干辣椒和花椒，再放入葱蒜爆香。' },
      { title: '合炒出锅', desc: '倒入鸡丁快速翻炒，沿锅边淋入碗汁翻炒均匀，最后加花生米翻匀即成。' }
    ]
  },
  {
    id: 4,
    name: '清蒸鲈鱼',
    brief: '鲜嫩可口、原汁原味的海鲜佳肴',
    category: '海鲜',
    catClass: 'seafood',
    difficulty: '简单',
    time: '20分钟',
    icon: '🐟',
    bgStyle: 'linear-gradient(135deg, #74b9ff, #0984e3)',
    ingredients: [
      { name: '鲈鱼', amount: '1条(约500g)' },
      { name: '姜丝', amount: '适量' },
      { name: '葱丝', amount: '适量' },
      { name: '蒸鱼豉油', amount: '3勺' },
      { name: '料酒', amount: '1勺' },
      { name: '植物油', amount: '适量' }
    ],
    steps: [
      { title: '处理鱼', desc: '鲈鱼去鳞去内脏洗净，鱼身两面划斜刀便于入味，用盐和料酒抹遍鱼身腌制10分钟。' },
      { title: '摆盘', desc: '盘底铺部分姜丝葱段，将鱼放上，鱼身上面再铺一层姜丝。' },
      { title: '蒸制', desc: '水开后上锅大火蒸8-10分钟（根据鱼大小调整时间），关火虚蒸2分钟。' },
      { title: '调味', desc: '倒掉盘中蒸出的汤汁，去掉旧的姜葱丝，淋上蒸鱼豉油。' },
      { title: '泼热油', desc: '鱼身上铺新鲜葱丝，烧一勺热油浇在葱丝上激发出香味即可上桌。' }
    ]
  },
  {
    id: 5,
    name: '番茄鸡蛋面',
    brief: '酸爽开胃、快手营养的家常面条',
    category: '主食',
    catClass: 'staple',
    difficulty: '简单',
    time: '15分钟',
    icon: '🍜',
    bgStyle: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
    ingredients: [
      { name: '面条', amount: '1人份' },
      { name: '番茄', amount: '2个' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱花', amount: '适量' },
      { name: '番茄酱', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '糖', amount: '少许' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { title: '备菜', desc: '番茄顶部划十字，用开水烫一下去皮后切小块；鸡蛋打散备用。' },
      { title: '炒蛋', desc: '锅中热油，倒入蛋液快速滑散成块状，盛出备用。' },
      { title: '炒番茄', desc: '锅底留油，下番茄块中小火煸炒出汁，可加一勺番茄酱增加风味。' },
      { title: '煮汤底', desc: '加入适量热水或高汤煮开，调入盐和少许糖提鲜。' },
      { title: '煮面装碗', desc: '另起锅煮面条至熟透捞出碗中，浇上番茄鸡蛋汤，撒葱花即可。' }
    ]
  },
  {
    id: 6,
    name: '可乐鸡翅',
    brief: '甜香软糯、老少皆宜的网红菜品',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '简单',
    time: '30分钟',
    icon: '🍖',
    bgStyle: 'linear-gradient(135deg, #e17055, #a33b0f)',
    ingredients: [
      { name: '鸡翅中', amount: '8-10个' },
      { name: '可乐', amount: '1罐(330ml)' },
      { name: '酱油', amount: '2勺' },
      { name: '料酒', amount: '1勺' },
      { name: '姜片', amount: '3片' },
      { name: '熟芝麻', amount: '少许' }
    ],
    steps: [
      { title: '处理鸡翅', desc: '鸡翅两面各划两刀方便入味，冷水下锅焯水去血沫，捞出擦干水分。' },
      { title: '煎鸡翅', desc: '锅中放少量油，中小火将鸡翅煎至两面金黄。' },
      { title: '加调料', desc: '放入姜片、料酒、酱油翻炒均匀，让鸡翅裹上酱色。' },
      { title: '焖煮', desc: '倒入可乐没过鸡翅，大火烧开转中小火焖煮20分钟。' },
      { title: '收汁', desc: '开大火不断翻动收汁至浓稠挂浆，撒芝麻点缀出锅。' }
    ]
  }
]

module.exports = foods
