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
  },
  // ===== 新增菜品 =====
  {
    id: 7,
    name: '糖醋排骨',
    brief: '酸甜可口、外酥里嫩的宴客硬菜',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '中等',
    time: '40分钟',
    icon: '🍖',
    bgStyle: 'linear-gradient(135deg, #f8b500, #e67e22)',
    ingredients: [
      { name: '猪小排', amount: '500g' },
      { name: '白糖', amount: '3勺' },
      { name: '香醋', amount: '2勺' },
      { name: '料酒', amount: '1勺' },
      { name: '生抽', amount: '1勺' },
      { name: '番茄酱', amount: '1勺' },
      { name: '熟白芝麻', amount: '适量' }
    ],
    steps: [
      { title: '处理排骨', desc: '排骨洗净剁成5cm段，冷水浸泡30分钟去血水后沥干。' },
      { title: '炸排骨', desc: '油温六成热时下入排骨，中火炸至表面金黄捞出控油。' },
      { title: '调糖醋汁', desc: '锅中留底油，放入白糖小火炒至焦糖色，沿锅边烹入香醋翻炒起泡。' },
      { title: '裹汁', desc: '迅速倒入炸好的排骨翻拌均匀，让每块排骨都裹满糖醋汁。' },
      { title: '出锅装盘', desc: '撒上熟白芝麻即可出锅，趁热享用口感最佳。' }
    ]
  },
  {
    id: 8,
    name: '蒜蓉粉丝蒸扇贝',
    brief: '鲜甜嫩滑、蒜香浓郁的海鲜美味',
    category: '海鲜',
    catClass: 'seafood',
    difficulty: '简单',
    time: '18分钟',
    icon: '🦪',
    bgStyle: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
    ingredients: [
      { name: '扇贝', amount: '6个' },
      { name: '粉丝', amount: '1把' },
      { name: '大蒜', amount: '1头' },
      { name: '小米椒', amount: '2个' },
      { name: '蒸鱼豉油', amount: '2勺' },
      { name: '葱花', amount: '适量' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { title: '泡发粉丝', desc: '粉丝用温水泡软沥干，剪成合适长度备用。' },
      { title: '处理扇贝', desc: '扇贝洗净去内脏（保留贝柱），贝壳刷洗干净待用。' },
      { title: '摆盘', desc: '每个贝壳中依次铺上粉丝、贝柱，摆入盘中。' },
      { title: '调蒜蓉', desc: '蒜末分两份，一份生蒜蓉，一份炸至金黄蒜蓉，混合均匀加盐调味。' },
      { title: '蒸制', desc: '每只扇贝上铺蒜蓉酱，水开后大火蒸6分钟，淋热油和蒸鱼豉油即可。' }
    ]
  },
  {
    id: 9,
    name: '地三鲜',
    brief: '咸鲜软糯、经典东北家常素菜',
    category: '素菜',
    catClass: 'vege',
    difficulty: '简单',
    time: '25分钟',
    icon: '🥔',
    bgStyle: 'linear-gradient(135deg, #a0c659, #6ab04c)',
    ingredients: [
      { name: '土豆', amount: '1个(中等)' },
      { name: '茄子', amount: '1根' },
      { name: '青椒', amount: '1个' },
      { name: '蒜末', amount: '适量' },
      { name: '生抽', amount: '2勺' },
      { name: '蚝油', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '淀粉', amount: '少许' }
    ],
    steps: [
      { title: '切配蔬菜', desc: '土豆去皮切块，茄子切滚刀块拍干淀粉，青椒掰成小块备用。' },
      { title: '炸土豆', desc: '油温六成热，下土豆块中火炸至表面金黄酥脆，捞出控油。' },
      { title: '炸茄子', desc: '同锅下茄子块炸至表皮变软微黄，捞出备用。' },
      { title: '炒青椒调味', desc: '锅底留少量油，爆香蒜末，下青椒快炒至断生。' },
      { title: '合炒出锅', desc: '倒入炸好的土豆和茄子，淋入生抽、蚝油和少许水淀粉翻炒均匀即成。' }
    ]
  },
  {
    id: 10,
    name: '蛋炒饭',
    brief: '粒粒分明、香气扑鼻的经典快手餐',
    category: '主食',
    catClass: 'staple',
    difficulty: '简单',
    time: '10分钟',
    icon: '🍳',
    bgStyle: 'linear-gradient(135deg, #ffeaa7, #f39c12)',
    ingredients: [
      { name: '米饭', amount: '1碗(隔夜最佳)' },
      { name: '鸡蛋', amount: '2个' },
      { name: '葱花', amount: '适量' },
      { name: '火腿丁', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { title: '准备米饭', desc: '最好使用隔夜冷藏饭，提前用手将饭团打散成颗粒状。' },
      { title: '炒蛋花', desc: '锅中热油，打入鸡蛋快速搅碎成松散蛋花，盛出一半备用。' },
      { title: '炒饭', desc: '锅底留油，倒入米饭中火不停翻炒至米粒颗颗分明。' },
      { title: '混合', desc: '将之前盛出的蛋花倒回锅中，加火腿丁继续翻炒均匀。' },
      { title: '调味出锅', desc: '撒上盐和葱花快速翻拌几下即可出锅装盘。' }
    ]
  },
  {
    id: 11,
    name: '酸菜鱼',
    brief: '酸辣开胃、鱼肉嫩滑的川味招牌',
    category: '海鲜',
    catClass: 'seafood',
    difficulty: '中等',
    time: '35分钟',
    icon: '🐠',
    bgStyle: 'linear-gradient(135deg, #00cec9, #0984e3)',
    ingredients: [
      { name: '草鱼/黑鱼', amount: '750g' },
      { name: '酸菜', amount: '300g' },
      { name: '蛋清', amount: '1个' },
      { name: '干辣椒', amount: '10个' },
      { name: '花椒', amount: '1大把' },
      { name: '生姜', amount: '1块' },
      { name: '大蒜', amount: '半头' },
      { name: '淀粉', amount: '适量' }
    ],
    steps: [
      { title: '片鱼片', desc: '鱼去头尾骨后将肉片成薄片越薄越好，用清水反复冲洗去除血水。' },
      { title: '腌鱼片', desc: '鱼片加少许盐、蛋清和淀粉抓匀上浆，冷藏腌制15分钟。' },
      { title: '炒酸菜', desc: '锅中热油爆香姜蒜，下酸菜段煸炒出酸香味。' },
      { title: '熬汤', desc: '加入清水或高汤煮沸转中小火煮5分钟让酸菜味道融入汤中。' },
      { title: '汆鱼泼油', desc: '一片片放入鱼片煮至变白（约30秒），表面铺满干辣椒花椒段，浇滚油炸出香味。' }
    ]
  },
  {
    id: 12,
    name: '回锅肉',
    brief: '肥瘦相间、香辣下饭的四川名菜',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '简单',
    time: '25分钟',
    icon: '🥓',
    bgStyle: 'linear-gradient(135deg, #fab1a0, #e55039)',
    ingredients: [
      { name: '五花肉', amount: '350g' },
      { name: '青蒜苗', amount: '3根' },
      { name: '郫县豆瓣酱', amount: '1.5勺' },
      { name: '豆豉', amount: '1勺' },
      { name: '甜面酱', amount: '1勺' },
      { name: '姜片', amount: '3片' },
      { name: '蒜片', amount: '适量' },
      { name: '花椒', amount: '几粒' }
    ],
    steps: [
      { title: '煮肉片', desc: '整块五花肉冷水下锅，加姜片料酒煮至七八成熟，筷子可轻松插入即可。' },
      { title: '切片', desc: '捞出晾凉后切成约2mm厚的薄片，越薄口感越好。' },
      { title: '煸出油', desc: '锅中不放油直接下肉片，中火慢慢煸出油脂至肉片边缘卷曲呈灯盏窝状。' },
      { title: '调味', desc: '肉片拨一边，下豆瓣酱炒出红油，再加豆豉、甜面酱、姜蒜翻炒均匀。' },
      { title: '出锅', desc: '放入斜刀切的青蒜苗段，大火快速翻炒至断生即可出锅装盘。' }
    ]
  },
  {
    id: 13,
    name: '西红柿炒鸡蛋',
    brief: '国民第一菜、酸甜嫩滑百吃不厌',
    category: '素菜',
    catClass: 'vege',
    difficulty: '入门',
    time: '10分钟',
    icon: '🍅',
    bgStyle: 'linear-gradient(135deg, #ff7675, #d63031)',
    ingredients: [
      { name: '番茄', amount: '2个(中等)' },
      { name: '鸡蛋', amount: '3个' },
      { name: '葱花', amount: '适量' },
      { name: '白糖', amount: '半勺' },
      { name: '盐', amount: '适量' },
      { name: '食用油', amount: '适量' }
    ],
    steps: [
      { title: '备料', desc: '番茄顶部划十字烫去皮后切成小块；鸡蛋打散加少许盐搅匀。' },
      { title: '炒蛋', desc: '锅中多放些油，油热后倒入蛋液，用铲子快速划散成蓬松的蛋块，盛出。' },
      { title: '炒番茄', desc: '不用洗锅，利用底油下番茄块，加半勺糖帮助出汁，中火炒出沙。' },
      { title: '合炒', desc: '倒入之前炒好的鸡蛋块与番茄充分融合。' },
      { title: '出锅', desc: '尝一下咸淡补适量盐，撒葱花翻拌均匀出锅，汤汁拌饭绝了！' }
    ]
  },
  {
    id: 14,
    name: '葱爆羊肉',
    brief: '葱香浓郁、羊肉鲜嫩的京式名肴',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '中等',
    time: '15分钟',
    icon: '🐑',
    bgStyle: 'linear-gradient(135deg, #cd84f1, #be2edd)',
    ingredients: [
      { name: '羊腿肉', amount: '250g' },
      { name: '大葱', amount: '2根' },
      { name: '酱油', amount: '1.5勺' },
      { name: '料酒', amount: '1勺' },
      { name: '白胡椒粉', amount: '少许' },
      { name: '香油', amount: '几滴' },
      { name: '盐', amount: '适量' },
      { name: '姜丝', amount: '少许' }
    ],
    steps: [
      { title: '切肉', desc: '羊肉逆着纹路切成薄片（冷冻半小时更好切），尽量薄且大小一致。' },
      { title: '切葱', desc: '大葱取葱白部分切成斜马耳朵段，长度略大于肉片。' },
      { title: '腌肉', desc: '肉片加酱油、料酒、胡椒粉抓匀腌制5分钟入味。' },
      { title: '爆炒', desc: '锅中烧热油至冒烟，快速下羊肉滑炒至变色立即盛出。' },
      { title: '葱爆合炒', desc: '锅中余油烧热，下葱白段大火爆炒至微微透明，倒入羊肉快速翻炒，淋香油出锅。' }
    ]
  },
  {
    id: 15,
    name: '虾仁滑蛋',
    brief: '蛋嫩虾鲜、营养丰富的粤菜精品',
    category: '海鲜',
    catClass: 'seafood',
    difficulty: '简单',
    time: '15分钟',
    icon: '🍤',
    bgStyle: 'linear-gradient(135deg, #81ecec, #00cec9)',
    ingredients: [
      { name: '鲜虾仁', amount: '200g' },
      { name: '鸡蛋', amount: '4个' },
      { name: '葱花', amount: '适量' },
      { name: '料酒', amount: '半勺' },
      { name: '盐', amount: '适量' },
      { name: '白胡椒粉', amount: '少许' },
      { name: '淀粉', amount: '1茶匙' }
    ],
    steps: [
      { title: '处理虾仁', desc: '虾仁去虾线，从背部开一刀但不要切断，冲洗干净后用厨房纸吸干水分。' },
      { title: '腌制', desc: '虾仁加盐、料酒、胡椒粉和少许淀粉抓匀腌制10分钟。' },
      { title: '焯虾仁', desc: '沸水中焯烫虾仁至卷曲变色（约30秒），捞出沥水。' },
      { title: '打蛋液', desc: '鸡蛋打散加少许盐和清水（蛋液更嫩），加入虾仁拌匀。' },
      { title: '滑炒', desc: '锅中热油，油温五成热时倒入虾仁蛋液，用铲子轻轻推动，蛋液凝固即可出锅。' }
    ]
  },
  {
    id: 16,
    name: '手撕包菜',
    brief: '清脆爽口、酸辣过瘾的下饭神器',
    category: '素菜',
    catClass: 'vege',
    difficulty: '入门',
    time: '8分钟',
    icon: '🥬',
    bgStyle: 'linear-gradient(135deg, #55efc4, #00b894)',
    ingredients: [
      { name: '包菜', amount: '半个' },
      { name: '干红辣椒', amount: '5个' },
      { name: '蒜片', amount: '5瓣' },
      { name: '花椒', amount: '一小撮' },
      { name: '陈醋', amount: '1.5勺' },
      { name: '生抽', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '糖', amount: '少许' }
    ],
    steps: [
      { title: '撕包菜', desc: '包菜用手撕成不规则的小块（手撕比刀切更入味），洗净沥干。' },
      { title: '炝香料', desc: '锅中热油，小火炸香花椒和干辣椒段，捞出花椒不要。' },
      { title: '爆香', desc: '放入蒜片爆香，转大火。' },
      { title: '快炒', desc: '倒入包菜大火快速翻炒至微微变软（保持爽脆口感）。' },
      { title: '调味出锅', desc: '沿着锅边淋入陈醋，加生抽、盐和少许糖，大火猛炒至包菜断生即可出锅。' }
    ]
  },
  {
    id: 17,
    name: '牛肉拉面',
    brief: '汤醇面劲、肉烂入味的西北风味',
    category: '主食',
    catClass: 'staple',
    difficulty: '困难',
    time: '180分钟',
    icon: '🍜',
    bgStyle: 'linear-gradient(135deg, #dfe6e9, #b2bec3)',
    ingredients: [
      { name: '牛腩', amount: '500g' },
      { name: '拉面/面条', amount: '2人份' },
      { name: '白萝卜', amount: '半个' },
      { name: '香菜', amount: '适量' },
      { name: '八角', amount: '2个' },
      { name: '桂皮', amount: '1块' },
      { name: '香叶', amount: '2片' },
      { name: '干辣椒', amount: '3个' }
    ],
    steps: [
      { title: '炖牛肉', desc: '牛腩切块焯水去血沫，放入锅中加足量清水和所有香料，大火烧开转小火炖90分钟至软烂。' },
      { title: '加萝卜', desc: '白萝卜去皮切块放入汤中继续炖20分钟至透明入味。' },
      { title: '调味', desc: '取出香料渣，汤中加盐调味，撇去浮油使汤色清澈。' },
      { title: '煮面', desc: '另起锅烧开水煮面条至熟透，捞出放入碗中。' },
      { title: '装碗', desc: '舀上热气腾腾的牛肉汤，码上大块牛肉和白萝卜，撒香菜和辣椒油即可。' }
    ]
  },
  {
    id: 18,
    name: '蒜蓉西兰花',
    brief: '翠绿爽脆、清淡健康的快手素菜',
    category: '素菜',
    catClass: 'vege',
    difficulty: '入门',
    time: '8分钟',
    icon: '🥦',
    bgStyle: 'linear-gradient(135deg, #26de81, #20bf6b)',
    ingredients: [
      { name: '西兰花', amount: '1朵' },
      { name: '大蒜', amount: '5瓣' },
      { name: '蚝油', amount: '1勺' },
      { name: '盐', amount: '适量' },
      { name: '食用油', amount: '适量' },
      { name: '清水', amount: '少许' }
    ],
    steps: [
      { title: '处理西兰花', desc: '西兰花掰成小朵，淡盐水浸泡10分钟后洗净沥干水分。' },
      { title: '焯水', desc: '烧一锅开水加几滴油和少许盐，下西兰花焯水1分钟捞出（保持翠绿）。' },
      { title: '切蒜蓉', desc: '大蒜切成细末备用，越细蒜香味越浓。' },
      { title: '炒制', desc: '锅中热油小火爆香蒜末，倒入西兰花快速翻炒。' },
      { title: '调味出锅', desc: '淋入蚝油和适量清水翻炒收汁，加盐调味即可出锅。' }
    ]
  },
  {
    id: 19,
    name: '口水鸡',
    brief: '麻辣鲜香、鸡肉嫩滑的凉菜之王',
    category: '荤菜',
    catClass: 'meat',
    difficulty: '中等',
    time: '40分钟',
    icon: '🍗',
    bgStyle: 'linear-gradient(135deg, #eb4d4b, #c0392b)',
    ingredients: [
      { name: '鸡腿/鸡胸肉', amount: '2个(约400g)' },
      { name: '花生碎', amount: '1勺' },
      { name: '芝麻', amount: '1勺' },
      { name: '辣椒面', amount: '2勺' },
      { name: '蒜末', amount: '1勺' },
      { name: '生抽', amount: '3勺' },
      { name: '香醋', amount: '2勺' },
      { name: '花椒油', amount: '1勺' }
    ],
    steps: [
      { title: '煮鸡', desc: '鸡腿冷水下锅，加姜片料酒大火烧开转小火煮15分钟，关火焖10分钟。' },
      { title: '冰镇', desc: '捞出浸入冰水中冷却后切成条状或块状整齐码在盘内。' },
      { title: '做红油', desc: '碗中放辣椒面、芝麻、蒜末，浇热油炸出香味制成红油。' },
      { title: '调味汁', desc: '红油中加入生抽、香醋、花椒油、少许糖和盐拌匀成调味汁。' },
      { title: '浇汁装盘', desc: '将调味汁均匀淋在鸡肉上，撒上花生碎和葱花即可食用。' }
    ]
  },
  {
    id: 20,
    name: '皮蛋瘦肉粥',
    brief: '绵密顺滑、暖心养胃的广式经典',
    category: '主食',
    catClass: 'staple',
    difficulty: '简单',
    time: '60分钟',
    icon: '🥣',
    bgStyle: 'linear-gradient(135deg, #ecf0f1, #bdc3c7)',
    ingredients: [
      { name: '大米', amount: '100g' },
      { name: '瘦肉', amount: '100g' },
      { name: '皮蛋', amount: '2个' },
      { name: '姜丝', amount: '适量' },
      { name: '葱花', amount: '适量' },
      { name: '盐', amount: '适量' },
      { name: '香油', amount: '几滴' },
      { name: '白胡椒粉', amount: '少许' }
    ],
    steps: [
      { title: '腌肉', desc: '瘦肉切丝加少许盐、料酒和淀粉抓匀腌制15分钟。' },
      { title: '处理皮蛋', desc: '皮蛋剥壳切成小丁备用。' },
      { title: '煮粥', desc: '大米淘净加足量水（米水比1:8），大火烧开转小火熬煮40分钟至米粒开花。' },
      { title: '加料煮', desc: '先放入肉丝滑散煮至变色，再加入皮蛋丁继续煮10分钟。' },
      { title: '调味出锅', desc: '加入盐和白胡椒粉调味，滴几滴香油，撒上姜丝和葱花即可。' }
    ]
  }
]

module.exports = foods
