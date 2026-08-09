/**
 * Word translations data.
 * Importable by db.js for automatic seeding on server start.
 * Also runnable standalone: node server/seed-translations.js
 */

import pg from 'pg'

// { wordId: { ru, es, fr, de, zh } }
const TRANSLATIONS = {
  // ── Animals ─────────────────────────────────────────────────────────────
  cat:        { en:'cat',        ru:'кошка',               es:'gato',                 fr:'chat',                 de:'Katze',             zh:'猫' },
  dog:        { en:'dog',        ru:'собака',              es:'perro',                fr:'chien',                de:'Hund',              zh:'狗' },
  bird:       { en:'bird',       ru:'птица',               es:'pájaro',               fr:'oiseau',               de:'Vogel',             zh:'鸟' },
  fish:       { en:'fish',       ru:'рыба',                es:'pez',                  fr:'poisson',              de:'Fisch',             zh:'鱼' },
  cow:        { en:'cow',        ru:'корова',              es:'vaca',                 fr:'vache',                de:'Kuh',               zh:'牛' },
  horse:      { en:'horse',      ru:'лошадь',              es:'caballo',              fr:'cheval',               de:'Pferd',             zh:'马' },
  elephant:   { en:'elephant',   ru:'слон',                es:'elefante',             fr:'éléphant',             de:'Elefant',           zh:'大象' },
  lion:       { en:'lion',       ru:'лев',                 es:'león',                 fr:'lion',                 de:'Löwe',              zh:'狮子' },
  monkey:     { en:'monkey',     ru:'обезьяна',            es:'mono',                 fr:'singe',                de:'Affe',              zh:'猴子' },
  rabbit:     { en:'rabbit',     ru:'кролик',              es:'conejo',               fr:'lapin',                de:'Hase',              zh:'兔子' },
  frog:       { en:'frog',       ru:'лягушка',             es:'rana',                 fr:'grenouille',           de:'Frosch',            zh:'青蛙' },
  duck:       { en:'duck',       ru:'утка',                es:'pato',                 fr:'canard',               de:'Ente',              zh:'鸭子' },
  tiger:      { en:'tiger',      ru:'тигр',                es:'tigre',                fr:'tigre',                de:'Tiger',             zh:'老虎' },
  penguin:    { en:'penguin',    ru:'пингвин',             es:'pingüino',             fr:'pingouin',             de:'Pinguin',           zh:'企鹅' },
  crocodile:  { en:'crocodile',  ru:'крокодил',            es:'cocodrilo',            fr:'crocodile',            de:'Krokodil',          zh:'鳄鱼' },
  giraffe:    { en:'giraffe',    ru:'жираф',               es:'jirafa',               fr:'girafe',               de:'Giraffe',           zh:'长颈鹿' },
  bear:       { en:'bear',       ru:'медведь',             es:'oso',                  fr:'ours',                 de:'Bär',               zh:'熊' },
  wolf:       { en:'wolf',       ru:'волк',                es:'lobo',                 fr:'loup',                 de:'Wolf',              zh:'狼' },
  sheep:      { en:'sheep',      ru:'овца',                es:'oveja',                fr:'mouton',               de:'Schaf',             zh:'羊' },
  pig:        { en:'pig',        ru:'свинья',              es:'cerdo',                fr:'cochon',               de:'Schwein',           zh:'猪' },

  // ── Fruits ──────────────────────────────────────────────────────────────
  apple:       { en:'apple',       ru:'яблоко',      es:'manzana',     fr:'pomme',          de:'Apfel',         zh:'苹果' },
  banana:      { en:'banana',      ru:'банан',        es:'plátano',     fr:'banane',         de:'Banane',        zh:'香蕉' },
  orange:      { en:'orange',      ru:'апельсин',     es:'naranja',     fr:'orange',         de:'Orange',        zh:'橙子' },
  grape:       { en:'grape',       ru:'виноград',     es:'uva',         fr:'raisin',         de:'Traube',        zh:'葡萄' },
  strawberry:  { en:'strawberry',  ru:'клубника',     es:'fresa',       fr:'fraise',         de:'Erdbeere',      zh:'草莓' },
  watermelon:  { en:'watermelon',  ru:'арбуз',        es:'sandía',      fr:'pastèque',       de:'Wassermelone',  zh:'西瓜' },
  pear:        { en:'pear',        ru:'груша',        es:'pera',        fr:'poire',          de:'Birne',         zh:'梨' },
  cherry:      { en:'cherry',      ru:'вишня',        es:'cereza',      fr:'cerise',         de:'Kirsche',       zh:'樱桃' },
  peach:       { en:'peach',       ru:'персик',       es:'melocotón',   fr:'pêche',          de:'Pfirsich',      zh:'桃子' },
  lemon:       { en:'lemon',       ru:'лимон',        es:'limón',       fr:'citron',         de:'Zitrone',       zh:'柠檬' },
  mango:       { en:'mango',       ru:'манго',        es:'mango',       fr:'mangue',         de:'Mango',         zh:'芒果' },
  pineapple:   { en:'pineapple',   ru:'ананас',       es:'piña',        fr:'ananas',         de:'Ananas',        zh:'菠萝' },
  coconut:     { en:'coconut',     ru:'кокос',        es:'coco',        fr:'noix de coco',   de:'Kokosnuss',     zh:'椰子' },
  kiwi:        { en:'kiwi',        ru:'киви',         es:'kiwi',        fr:'kiwi',           de:'Kiwi',          zh:'猕猴桃' },
  plum:        { en:'plum',        ru:'слива',        es:'ciruela',     fr:'prune',          de:'Pflaume',       zh:'李子' },
  blueberry:   { en:'blueberry',   ru:'черника',      es:'arándano',    fr:'myrtille',       de:'Blaubeere',     zh:'蓝莓' },
  lime:        { en:'lime',        ru:'лайм',         es:'lima',        fr:'citron vert',    de:'Limette',       zh:'青柠' },
  melon:       { en:'melon',       ru:'дыня',         es:'melón',       fr:'melon',          de:'Melone',        zh:'哈密瓜' },
  fig:         { en:'fig',         ru:'инжир',        es:'higo',        fr:'figue',          de:'Feige',         zh:'无花果' },
  pomegranate: { en:'pomegranate', ru:'гранат',       es:'granada',     fr:'grenade',        de:'Granatapfel',   zh:'石榴' },

  // ── Vehicles ─────────────────────────────────────────────────────────────
  car:         { en:'car',             ru:'машина',              es:'coche',               fr:'voiture',             de:'Auto',              zh:'汽车' },
  bus:         { en:'bus',             ru:'автобус',             es:'autobús',             fr:'bus',                 de:'Bus',               zh:'公共汽车' },
  train:       { en:'train',           ru:'поезд',               es:'tren',                fr:'train',               de:'Zug',               zh:'火车' },
  airplane:    { en:'airplane',        ru:'самолёт',             es:'avión',               fr:'avion',               de:'Flugzeug',          zh:'飞机' },
  boat:        { en:'boat',            ru:'лодка',               es:'barco',               fr:'bateau',              de:'Boot',              zh:'船' },
  bicycle:     { en:'bicycle',         ru:'велосипед',           es:'bicicleta',           fr:'vélo',                de:'Fahrrad',           zh:'自行车' },
  truck:       { en:'truck',           ru:'грузовик',            es:'camión',              fr:'camion',              de:'LKW',               zh:'卡车' },
  motorcycle:  { en:'motorcycle',      ru:'мотоцикл',            es:'moto',                fr:'moto',                de:'Motorrad',          zh:'摩托车' },
  helicopter:  { en:'helicopter',      ru:'вертолёт',            es:'helicóptero',         fr:'hélicoptère',         de:'Hubschrauber',      zh:'直升机' },
  rocket:      { en:'rocket',          ru:'ракета',              es:'cohete',              fr:'fusée',               de:'Rakete',            zh:'火箭' },
  tractor:     { en:'tractor',         ru:'трактор',             es:'tractor',             fr:'tracteur',            de:'Traktor',           zh:'拖拉机' },
  ambulance:   { en:'ambulance',       ru:'скорая помощь',       es:'ambulancia',          fr:'ambulance',           de:'Krankenwagen',      zh:'救护车' },
  submarine:   { en:'submarine',       ru:'подводная лодка',     es:'submarino',           fr:'sous-marin',          de:'U-Boot',            zh:'潜水艇' },
  scooter:     { en:'scooter',         ru:'самокат',             es:'patinete',            fr:'trottinette',         de:'Roller',            zh:'踏板车' },
  taxi:        { en:'taxi',            ru:'такси',               es:'taxi',                fr:'taxi',                de:'Taxi',              zh:'出租车' },
  firetruck:   { en:'fire truck',      ru:'пожарная машина',     es:'camión de bomberos',  fr:'camion de pompiers',  de:'Feuerwehrauto',     zh:'消防车' },
  canoe:       { en:'canoe',           ru:'каноэ',               es:'canoa',               fr:'canoë',               de:'Kanu',              zh:'独木舟' },
  skateboard:  { en:'skateboard',      ru:'скейтборд',           es:'monopatín',           fr:'skateboard',          de:'Skateboard',        zh:'滑板' },
  balloon:     { en:'hot air balloon', ru:'воздушный шар',       es:'globo aerostático',   fr:'montgolfière',        de:'Heißluftballon',    zh:'热气球' },
  spaceship:   { en:'spaceship',       ru:'космический корабль', es:'nave espacial',       fr:'vaisseau spatial',    de:'Raumschiff',        zh:'宇宙飞船' },

  // ── Food ─────────────────────────────────────────────────────────────────
  pizza:      { en:'pizza',      ru:'пицца',      es:'pizza',              fr:'pizza',        de:'Pizza',        zh:'披萨' },
  burger:     { en:'burger',     ru:'бургер',     es:'hamburguesa',        fr:'hamburger',    de:'Burger',       zh:'汉堡' },
  icecream:   { en:'ice cream',  ru:'мороженое',  es:'helado',             fr:'glace',        de:'Eis',          zh:'冰淇淋' },
  cake:       { en:'cake',       ru:'торт',       es:'pastel',             fr:'gâteau',       de:'Kuchen',       zh:'蛋糕' },
  cookie:     { en:'cookie',     ru:'печенье',    es:'galleta',            fr:'biscuit',      de:'Keks',         zh:'饼干' },
  donut:      { en:'donut',      ru:'пончик',     es:'donut',              fr:'beignet',      de:'Donut',        zh:'甜甜圈' },
  hotdog:     { en:'hot dog',    ru:'хот-дог',    es:'perrito caliente',   fr:'hot-dog',      de:'Hotdog',       zh:'热狗' },
  taco:       { en:'taco',       ru:'тако',       es:'taco',               fr:'taco',         de:'Taco',         zh:'墨西哥卷饼' },
  sushi:      { en:'sushi',      ru:'суши',       es:'sushi',              fr:'sushi',        de:'Sushi',        zh:'寿司' },
  popcorn:    { en:'popcorn',    ru:'попкорн',    es:'palomitas',          fr:'pop-corn',     de:'Popcorn',      zh:'爆米花' },
  sandwich:   { en:'sandwich',   ru:'бутерброд',  es:'sándwich',           fr:'sandwich',     de:'Sandwich',     zh:'三明治' },
  pasta:      { en:'pasta',      ru:'паста',      es:'pasta',              fr:'pâtes',        de:'Nudeln',       zh:'意大利面' },
  salad:      { en:'salad',      ru:'салат',      es:'ensalada',           fr:'salade',       de:'Salat',        zh:'沙拉' },
  soup:       { en:'soup',       ru:'суп',        es:'sopa',               fr:'soupe',        de:'Suppe',        zh:'汤' },
  steak:      { en:'steak',      ru:'стейк',      es:'filete',             fr:'steak',        de:'Steak',        zh:'牛排' },
  eggs:       { en:'eggs',       ru:'яйца',       es:'huevos',             fr:'œufs',         de:'Eier',         zh:'鸡蛋' },
  bread:      { en:'bread',      ru:'хлеб',       es:'pan',                fr:'pain',         de:'Brot',         zh:'面包' },
  cheese:     { en:'cheese',     ru:'сыр',        es:'queso',              fr:'fromage',      de:'Käse',         zh:'奶酪' },
  chocolate:  { en:'chocolate',  ru:'шоколад',    es:'chocolate',          fr:'chocolat',     de:'Schokolade',   zh:'巧克力' },
  pancakes:   { en:'pancakes',   ru:'блины',      es:'tortitas',           fr:'crêpes',       de:'Pfannkuchen',  zh:'煎饼' },

  // ── Nature ───────────────────────────────────────────────────────────────
  tree:       { en:'tree',       ru:'дерево',    es:'árbol',          fr:'arbre',            de:'Baum',           zh:'树' },
  flower:     { en:'flower',     ru:'цветок',    es:'flor',           fr:'fleur',            de:'Blume',          zh:'花' },
  sun:        { en:'sun',        ru:'солнце',    es:'sol',            fr:'soleil',           de:'Sonne',          zh:'太阳' },
  moon:       { en:'moon',       ru:'луна',      es:'luna',           fr:'lune',             de:'Mond',           zh:'月亮' },
  star:       { en:'star',       ru:'звезда',    es:'estrella',       fr:'étoile',           de:'Stern',          zh:'星星' },
  cloud:      { en:'cloud',      ru:'облако',    es:'nube',           fr:'nuage',            de:'Wolke',          zh:'云' },
  rainbow:    { en:'rainbow',    ru:'радуга',    es:'arcoíris',       fr:'arc-en-ciel',      de:'Regenbogen',     zh:'彩虹' },
  snowflake:  { en:'snowflake',  ru:'снежинка',  es:'copo de nieve',  fr:'flocon de neige',  de:'Schneeflocke',   zh:'雪花' },
  mountain:   { en:'mountain',   ru:'гора',      es:'montaña',        fr:'montagne',         de:'Berg',           zh:'山' },
  volcano:    { en:'volcano',    ru:'вулкан',    es:'volcán',         fr:'volcan',           de:'Vulkan',         zh:'火山' },
  wave:       { en:'wave',       ru:'волна',     es:'ola',            fr:'vague',            de:'Welle',          zh:'波浪' },
  leaf:       { en:'leaf',       ru:'лист',      es:'hoja',           fr:'feuille',          de:'Blatt',          zh:'叶子' },
  forest:     { en:'forest',     ru:'лес',       es:'bosque',         fr:'forêt',            de:'Wald',           zh:'森林' },
  river:      { en:'river',      ru:'река',      es:'río',            fr:'rivière',          de:'Fluss',          zh:'河流' },
  desert:     { en:'desert',     ru:'пустыня',   es:'desierto',       fr:'désert',           de:'Wüste',          zh:'沙漠' },
  waterfall:  { en:'waterfall',  ru:'водопад',   es:'cascada',        fr:'cascade',          de:'Wasserfall',     zh:'瀑布' },
  lightning:  { en:'lightning',  ru:'молния',    es:'rayo',           fr:'éclair',           de:'Blitz',          zh:'闪电' },
  tornado:    { en:'tornado',    ru:'торнадо',   es:'tornado',        fr:'tornade',          de:'Tornado',        zh:'龙卷风' },
  glacier:    { en:'glacier',    ru:'ледник',    es:'glaciar',        fr:'glacier',          de:'Gletscher',      zh:'冰川' },
  island:     { en:'island',     ru:'остров',    es:'isla',           fr:'île',              de:'Insel',          zh:'岛屿' },

  // ── Sports ───────────────────────────────────────────────────────────────
  soccer:       { en:'soccer',        ru:'футбол',                es:'fútbol',            fr:'football',             de:'Fußball',          zh:'足球' },
  basketball:   { en:'basketball',    ru:'баскетбол',             es:'baloncesto',        fr:'basket-ball',          de:'Basketball',       zh:'篮球' },
  tennis:       { en:'tennis',        ru:'теннис',                es:'tenis',             fr:'tennis',               de:'Tennis',           zh:'网球' },
  baseball:     { en:'baseball',      ru:'бейсбол',               es:'béisbol',           fr:'baseball',             de:'Baseball',         zh:'棒球' },
  football:     { en:'football',      ru:'американский футбол',   es:'fútbol americano',  fr:'football américain',   de:'American Football', zh:'橄榄球' },
  volleyball:   { en:'volleyball',    ru:'волейбол',              es:'voleibol',          fr:'volley-ball',          de:'Volleyball',       zh:'排球' },
  bowling:      { en:'bowling',       ru:'боулинг',               es:'bolos',             fr:'bowling',              de:'Bowling',          zh:'保龄球' },
  golf:         { en:'golf',          ru:'гольф',                 es:'golf',              fr:'golf',                 de:'Golf',             zh:'高尔夫' },
  boxing:       { en:'boxing',        ru:'бокс',                  es:'boxeo',             fr:'boxe',                 de:'Boxen',            zh:'拳击' },
  swimming:     { en:'swimming',      ru:'плавание',              es:'natación',          fr:'natation',             de:'Schwimmen',        zh:'游泳' },
  skiing:       { en:'skiing',        ru:'лыжи',                  es:'esquí',             fr:'ski',                  de:'Skifahren',        zh:'滑雪' },
  cycling:      { en:'cycling',       ru:'велоспорт',             es:'ciclismo',          fr:'cyclisme',             de:'Radfahren',        zh:'自行车运动' },
  archery:      { en:'archery',       ru:'стрельба из лука',      es:'tiro con arco',     fr:"tir à l'arc",          de:'Bogenschießen',    zh:'射箭' },
  gymnastics:   { en:'gymnastics',    ru:'гимнастика',            es:'gimnasia',          fr:'gymnastique',          de:'Turnen',           zh:'体操' },
  surfing:      { en:'surfing',       ru:'сёрфинг',               es:'surf',              fr:'surf',                 de:'Surfen',           zh:'冲浪' },
  running:      { en:'running',       ru:'бег',                   es:'carrera',           fr:'course',               de:'Laufen',           zh:'跑步' },
  weightlifting:{ en:'weightlifting', ru:'тяжёлая атлетика',      es:'halterofilia',      fr:'haltérophilie',        de:'Gewichtheben',     zh:'举重' },
  yoga:         { en:'yoga',          ru:'йога',                  es:'yoga',              fr:'yoga',                 de:'Yoga',             zh:'瑜伽' },
  karate:       { en:'karate',        ru:'каратэ',                es:'kárate',            fr:'karaté',               de:'Karate',           zh:'空手道' },
  horseriding:  { en:'horse riding',  ru:'верховая езда',         es:'equitación',        fr:'équitation',           de:'Reiten',           zh:'骑马' },

  // ── Clothes ──────────────────────────────────────────────────────────────
  shirt:    { en:'shirt',     ru:'рубашка',    es:'camisa',         fr:'chemise',          de:'Hemd',          zh:'衬衫' },
  pants:    { en:'pants',     ru:'брюки',      es:'pantalones',     fr:'pantalon',         de:'Hose',          zh:'裤子' },
  hat:      { en:'hat',       ru:'шляпа',      es:'sombrero',       fr:'chapeau',          de:'Hut',           zh:'帽子' },
  shoe:     { en:'shoe',      ru:'туфля',      es:'zapato',         fr:'chaussure',        de:'Schuh',         zh:'鞋子' },
  dress:    { en:'dress',     ru:'платье',     es:'vestido',        fr:'robe',             de:'Kleid',         zh:'裙子' },
  glasses:  { en:'glasses',   ru:'очки',       es:'gafas',          fr:'lunettes',         de:'Brille',        zh:'眼镜' },
  glove:    { en:'glove',     ru:'перчатка',   es:'guante',         fr:'gant',             de:'Handschuh',     zh:'手套' },
  sock:     { en:'sock',      ru:'носок',      es:'calcetín',       fr:'chaussette',       de:'Socke',         zh:'袜子' },
  scarf:    { en:'scarf',     ru:'шарф',       es:'bufanda',        fr:'écharpe',          de:'Schal',         zh:'围巾' },
  crown:    { en:'crown',     ru:'корона',     es:'corona',         fr:'couronne',         de:'Krone',         zh:'皇冠' },
  swimsuit: { en:'swimsuit',  ru:'купальник',  es:'bañador',        fr:'maillot de bain',  de:'Badeanzug',     zh:'泳衣' },
  boot:     { en:'boot',      ru:'сапог',      es:'bota',           fr:'botte',            de:'Stiefel',       zh:'靴子' },
  tie:      { en:'tie',       ru:'галстук',    es:'corbata',        fr:'cravate',          de:'Krawatte',      zh:'领带' },
  bag:      { en:'bag',       ru:'сумка',      es:'bolso',          fr:'sac',              de:'Tasche',        zh:'包' },
  belt:     { en:'belt',      ru:'ремень',     es:'cinturón',       fr:'ceinture',         de:'Gürtel',        zh:'腰带' },
  umbrella: { en:'umbrella',  ru:'зонт',       es:'paraguas',       fr:'parapluie',        de:'Regenschirm',   zh:'雨伞' },
  backpack: { en:'backpack',  ru:'рюкзак',     es:'mochila',        fr:'sac à dos',        de:'Rucksack',      zh:'背包' },
  jacket:   { en:'jacket',    ru:'куртка',     es:'chaqueta',       fr:'veste',            de:'Jacke',         zh:'夹克' },
  watch:    { en:'watch',     ru:'часы',       es:'reloj',          fr:'montre',           de:'Uhr',           zh:'手表' },
  sweater:  { en:'sweater',   ru:'свитер',     es:'suéter',         fr:'pull',             de:'Pullover',      zh:'毛衣' },

  // ── Body ─────────────────────────────────────────────────────────────────
  hand:     { en:'hand',      ru:'рука',           es:'mano',       fr:'main',       de:'Hand',          zh:'手' },
  eye:      { en:'eye',       ru:'глаз',           es:'ojo',        fr:'œil',        de:'Auge',          zh:'眼睛' },
  ear:      { en:'ear',       ru:'ухо',            es:'oreja',      fr:'oreille',    de:'Ohr',           zh:'耳朵' },
  nose:     { en:'nose',      ru:'нос',            es:'nariz',      fr:'nez',        de:'Nase',          zh:'鼻子' },
  mouth:    { en:'mouth',     ru:'рот',            es:'boca',       fr:'bouche',     de:'Mund',          zh:'嘴巴' },
  tooth:    { en:'tooth',     ru:'зуб',            es:'diente',     fr:'dent',       de:'Zahn',          zh:'牙齿' },
  brain:    { en:'brain',     ru:'мозг',           es:'cerebro',    fr:'cerveau',    de:'Gehirn',        zh:'大脑' },
  bone:     { en:'bone',      ru:'кость',          es:'hueso',      fr:'os',         de:'Knochen',       zh:'骨头' },
  heart:    { en:'heart',     ru:'сердце',         es:'corazón',    fr:'cœur',       de:'Herz',          zh:'心脏' },
  foot:     { en:'foot',      ru:'стопа',          es:'pie',        fr:'pied',       de:'Fuß',           zh:'脚' },
  muscle:   { en:'muscle',    ru:'мышца',          es:'músculo',    fr:'muscle',     de:'Muskel',        zh:'肌肉' },
  tongue:   { en:'tongue',    ru:'язык',           es:'lengua',     fr:'langue',     de:'Zunge',         zh:'舌头' },
  neck:     { en:'neck',      ru:'шея',            es:'cuello',     fr:'cou',        de:'Hals',          zh:'脖子' },
  shoulder: { en:'shoulder',  ru:'плечо',          es:'hombro',     fr:'épaule',     de:'Schulter',      zh:'肩膀' },
  knee:     { en:'knee',      ru:'колено',         es:'rodilla',    fr:'genou',      de:'Knie',          zh:'膝盖' },
  elbow:    { en:'elbow',     ru:'локоть',         es:'codo',       fr:'coude',      de:'Ellbogen',      zh:'肘部' },
  wrist:    { en:'wrist',     ru:'запястье',       es:'muñeca',     fr:'poignet',    de:'Handgelenk',    zh:'手腕' },
  chin:     { en:'chin',      ru:'подбородок',     es:'barbilla',   fr:'menton',     de:'Kinn',          zh:'下巴' },
  back:     { en:'back',      ru:'спина',          es:'espalda',    fr:'dos',        de:'Rücken',        zh:'背部' },
  forehead: { en:'forehead',  ru:'лоб',            es:'frente',     fr:'front',      de:'Stirn',         zh:'额头' },

  // ── Insects ──────────────────────────────────────────────────────────────
  butterfly:   { en:'butterfly',   ru:'бабочка',        es:'mariposa',     fr:'papillon',      de:'Schmetterling',     zh:'蝴蝶' },
  bee:         { en:'bee',         ru:'пчела',          es:'abeja',        fr:'abeille',       de:'Biene',             zh:'蜜蜂' },
  ant:         { en:'ant',         ru:'муравей',        es:'hormiga',      fr:'fourmi',        de:'Ameise',            zh:'蚂蚁' },
  ladybug:     { en:'ladybug',     ru:'божья коровка',  es:'mariquita',    fr:'coccinelle',    de:'Marienkäfer',       zh:'瓢虫' },
  dragonfly:   { en:'dragonfly',   ru:'стрекоза',       es:'libélula',     fr:'libellule',     de:'Libelle',           zh:'蜻蜓' },
  grasshopper: { en:'grasshopper', ru:'кузнечик',       es:'saltamontes',  fr:'sauterelle',    de:'Heuschrecke',       zh:'蚱蜢' },
  mosquito:    { en:'mosquito',    ru:'комар',          es:'mosquito',     fr:'moustique',     de:'Mücke',             zh:'蚊子' },
  spider:      { en:'spider',      ru:'паук',           es:'araña',        fr:'araignée',      de:'Spinne',            zh:'蜘蛛' },
  beetle:      { en:'beetle',      ru:'жук',            es:'escarabajo',   fr:'scarabée',      de:'Käfer',             zh:'甲虫' },
  caterpillar: { en:'caterpillar', ru:'гусеница',       es:'oruga',        fr:'chenille',      de:'Raupe',             zh:'毛毛虫' },
  fly:         { en:'fly',         ru:'муха',           es:'mosca',        fr:'mouche',        de:'Fliege',            zh:'苍蝇' },
  moth:        { en:'moth',        ru:'мотылёк',        es:'polilla',      fr:'mite',          de:'Motte',             zh:'飞蛾' },
  wasp:        { en:'wasp',        ru:'оса',            es:'avispa',       fr:'guêpe',         de:'Wespe',             zh:'黄蜂' },
  cricket:     { en:'cricket',     ru:'сверчок',        es:'grillo',       fr:'grillon',       de:'Grille',            zh:'蟋蟀' },
  firefly:     { en:'firefly',     ru:'светлячок',      es:'luciérnaga',   fr:'luciole',       de:'Glühwürmchen',      zh:'萤火虫' },
  cockroach:   { en:'cockroach',   ru:'таракан',        es:'cucaracha',    fr:'cafard',        de:'Kakerlake',         zh:'蟑螂' },
  mantis:      { en:'mantis',      ru:'богомол',        es:'mantis',       fr:'mante',         de:'Gottesanbeterin',   zh:'螳螂' },
  termite:     { en:'termite',     ru:'термит',         es:'termita',      fr:'termite',       de:'Termite',           zh:'白蚁' },
  centipede:   { en:'centipede',   ru:'сороконожка',    es:'ciempiés',     fr:'mille-pattes',  de:'Tausendfüßler',     zh:'蜈蚣' },
  scorpion:    { en:'scorpion',    ru:'скорпион',       es:'escorpión',    fr:'scorpion',      de:'Skorpion',          zh:'蝎子' },

  // ── Colors ───────────────────────────────────────────────────────────────
  red:        { en:'red',        ru:'красный',     es:'rojo',        fr:'rouge',     de:'rot',              zh:'红色' },
  blue:       { en:'blue',       ru:'синий',       es:'azul',        fr:'bleu',      de:'blau',             zh:'蓝色' },
  green:      { en:'green',      ru:'зелёный',     es:'verde',       fr:'vert',      de:'grün',             zh:'绿色' },
  yellow:     { en:'yellow',     ru:'жёлтый',      es:'amarillo',    fr:'jaune',     de:'gelb',             zh:'黄色' },
  orange_c:   { en:'orange',     ru:'оранжевый',   es:'naranja',     fr:'orange',    de:'orange',           zh:'橙色' },
  purple:     { en:'purple',     ru:'фиолетовый',  es:'morado',      fr:'violet',    de:'lila',             zh:'紫色' },
  pink:       { en:'pink',       ru:'розовый',     es:'rosa',        fr:'rose',      de:'rosa',             zh:'粉色' },
  black:      { en:'black',      ru:'чёрный',      es:'negro',       fr:'noir',      de:'schwarz',          zh:'黑色' },
  white:      { en:'white',      ru:'белый',       es:'blanco',      fr:'blanc',     de:'weiß',             zh:'白色' },
  brown:      { en:'brown',      ru:'коричневый',  es:'marrón',      fr:'marron',    de:'braun',            zh:'棕色' },
  gray:       { en:'gray',       ru:'серый',       es:'gris',        fr:'gris',      de:'grau',             zh:'灰色' },
  gold:       { en:'gold',       ru:'золотой',     es:'dorado',      fr:'doré',      de:'golden',           zh:'金色' },
  silver:     { en:'silver',     ru:'серебряный',  es:'plateado',    fr:'argenté',   de:'silbern',          zh:'银色' },
  turquoise:  { en:'turquoise',  ru:'бирюзовый',   es:'turquesa',    fr:'turquoise', de:'türkis',           zh:'青绿色' },
  indigo:     { en:'indigo',     ru:'индиго',      es:'índigo',      fr:'indigo',    de:'Indigo',           zh:'靛蓝' },
  beige:      { en:'beige',      ru:'бежевый',     es:'beige',       fr:'beige',     de:'beige',            zh:'米色' },
  navy:       { en:'navy',       ru:'тёмно-синий', es:'azul marino', fr:'bleu marine',de:'marineblau',      zh:'海军蓝' },
  coral:      { en:'coral',      ru:'коралловый',  es:'coral',       fr:'corail',    de:'koralle',          zh:'珊瑚色' },
  mint:       { en:'mint',       ru:'мятный',      es:'menta',       fr:'menthe',    de:'mint',             zh:'薄荷绿' },
  maroon:     { en:'maroon',     ru:'бордовый',    es:'granate',     fr:'bordeaux',  de:'kastanienbraun',   zh:'褐红色' },

  // ── Numbers ──────────────────────────────────────────────────────────────
  one:       { en:'one',       ru:'один',           es:'uno',        fr:'un',        de:'eins',       zh:'一' },
  two:       { en:'two',       ru:'два',            es:'dos',        fr:'deux',      de:'zwei',       zh:'二' },
  three:     { en:'three',     ru:'три',            es:'tres',       fr:'trois',     de:'drei',       zh:'三' },
  four:      { en:'four',      ru:'четыре',         es:'cuatro',     fr:'quatre',    de:'vier',       zh:'四' },
  five:      { en:'five',      ru:'пять',           es:'cinco',      fr:'cinq',      de:'fünf',       zh:'五' },
  six:       { en:'six',       ru:'шесть',          es:'seis',       fr:'six',       de:'sechs',      zh:'六' },
  seven:     { en:'seven',     ru:'семь',           es:'siete',      fr:'sept',      de:'sieben',     zh:'七' },
  eight:     { en:'eight',     ru:'восемь',         es:'ocho',       fr:'huit',      de:'acht',       zh:'八' },
  nine:      { en:'nine',      ru:'девять',         es:'nueve',      fr:'neuf',      de:'neun',       zh:'九' },
  ten:       { en:'ten',       ru:'десять',         es:'diez',       fr:'dix',       de:'zehn',       zh:'十' },
  eleven:    { en:'eleven',    ru:'одиннадцать',    es:'once',       fr:'onze',      de:'elf',        zh:'十一' },
  twelve:    { en:'twelve',    ru:'двенадцать',     es:'doce',       fr:'douze',     de:'zwölf',      zh:'十二' },
  thirteen:  { en:'thirteen',  ru:'тринадцать',     es:'trece',      fr:'treize',    de:'dreizehn',   zh:'十三' },
  fourteen:  { en:'fourteen',  ru:'четырнадцать',   es:'catorce',    fr:'quatorze',  de:'vierzehn',   zh:'十四' },
  fifteen:   { en:'fifteen',   ru:'пятнадцать',     es:'quince',     fr:'quinze',    de:'fünfzehn',   zh:'十五' },
  sixteen:   { en:'sixteen',   ru:'шестнадцать',    es:'dieciséis',  fr:'seize',     de:'sechzehn',   zh:'十六' },
  seventeen: { en:'seventeen', ru:'семнадцать',     es:'diecisiete', fr:'dix-sept',  de:'siebzehn',   zh:'十七' },
  eighteen:  { en:'eighteen',  ru:'восемнадцать',   es:'dieciocho',  fr:'dix-huit',  de:'achtzehn',   zh:'十八' },
  nineteen:  { en:'nineteen',  ru:'девятнадцать',   es:'diecinueve', fr:'dix-neuf',  de:'neunzehn',   zh:'十九' },
  twenty:    { en:'twenty',    ru:'двадцать',       es:'veinte',     fr:'vingt',     de:'zwanzig',    zh:'二十' },
}

// Words that were renamed via admin panel: old ID → { expectedName, translations }
// Pass 3 checks both id AND current name, so dev DB (name still matches ID) is unaffected.
const TRANSLATIONS_RENAMED = [
  { id: 'penguin',    name: 'donkey',      t: { en:'donkey',       ru:'осёл',                  es:'burro',              fr:'âne',                   de:'Esel',               zh:'驴' } },
  { id: 'brain',      name: 'eyebrow',     t: { en:'eyebrow',      ru:'бровь',                 es:'ceja',               fr:'sourcil',               de:'Augenbraue',         zh:'眉毛' } },
  { id: 'balloon',    name: 'airship',     t: { en:'airship',      ru:'дирижабль',             es:'dirigible',          fr:'dirigeable',            de:'Luftschiff',         zh:'飞艇' } },
  { id: 'fig',        name: 'avocado',     t: { en:'avocado',      ru:'авокадо',               es:'aguacate',           fr:'avocat',                de:'Avocado',            zh:'牛油果' } },
  { id: 'boot',       name: 'boots',       t: { en:'boots',        ru:'сапоги',                es:'botas',              fr:'bottes',                de:'Stiefel',            zh:'靴子' } },
  { id: 'monkey',     name: 'chicken',     t: { en:'chicken',      ru:'курица',                es:'pollo',              fr:'poulet',                de:'Huhn',               zh:'鸡' } },
  { id: 'tiger',      name: 'cock',        t: { en:'cock',         ru:'петух',                 es:'gallo',              fr:'coq',                   de:'Hahn',               zh:'公鸡' } },
  { id: 'heart',      name: 'finger',      t: { en:'finger',       ru:'палец',                 es:'dedo',               fr:'doigt',                 de:'Finger',             zh:'手指' } },
  { id: 'glove',      name: 'gloves',      t: { en:'gloves',       ru:'перчатки',              es:'guantes',            fr:'gants',                 de:'Handschuhe',         zh:'手套' } },
  { id: 'elephant',   name: 'goat',        t: { en:'goat',         ru:'коза',                  es:'cabra',              fr:'chèvre',                de:'Ziege',              zh:'山羊' } },
  { id: 'bird',       name: 'goose',       t: { en:'goose',        ru:'гусь',                  es:'ganso',              fr:'oie',                   de:'Gans',               zh:'鹅' } },
  { id: 'bone',       name: 'hair',        t: { en:'hair',         ru:'волосы',                es:'cabello',            fr:'cheveux',               de:'Haare',              zh:'头发' } },
  { id: 'lion',       name: 'hamster',     t: { en:'hamster',      ru:'хомяк',                 es:'hámster',            fr:'hamster',               de:'Hamster',            zh:'仓鼠' } },
  { id: 'spaceship',  name: 'harvester',   t: { en:'harvester',    ru:'комбайн',               es:'cosechadora',        fr:'moissonneuse',          de:'Mähdrescher',        zh:'收割机' } },
  { id: 'foot',       name: 'legs',        t: { en:'legs',         ru:'ноги',                  es:'piernas',            fr:'jambes',                de:'Beine',              zh:'腿' } },
  { id: 'mouth',      name: 'lips',        t: { en:'lips',         ru:'губы',                  es:'labios',             fr:'lèvres',                de:'Lippen',             zh:'嘴唇' } },
  { id: 'muscle',     name: 'moustache',   t: { en:'moustache',    ru:'усы',                   es:'bigote',             fr:'moustache',             de:'Schnurrbart',        zh:'胡须' } },
  { id: 'hotdog',     name: 'mushroom',    t: { en:'mushroom',     ru:'гриб',                  es:'seta',               fr:'champignon',            de:'Pilz',               zh:'蘑菇' } },
  { id: 'turquoise',  name: 'light-blue',  t: { en:'light blue',   ru:'голубой',               es:'azul claro',         fr:'bleu clair',            de:'hellblau',           zh:'浅蓝色' } },
  { id: 'frog',       name: 'parrot',      t: { en:'parrot',       ru:'попугай',               es:'loro',               fr:'perroquet',             de:'Papagei',            zh:'鹦鹉' } },
  { id: 'canoe',      name: 'police car',  t: { en:'police car',   ru:'полицейская машина',    es:'coche de policía',   fr:'voiture de police',     de:'Polizeiauto',        zh:'警车' } },
  { id: 'taco',       name: 'porridge',    t: { en:'porridge',     ru:'каша',                  es:'gachas',             fr:'bouillie',              de:'Brei',               zh:'粥' } },
  { id: 'glacier',    name: 'rain',        t: { en:'rain',         ru:'дождь',                 es:'lluvia',             fr:'pluie',                 de:'Regen',              zh:'雨' } },
  { id: 'wave',       name: 'sea',         t: { en:'sea',          ru:'море',                  es:'mar',                fr:'mer',                   de:'Meer',               zh:'海' } },
  { id: 'rocket',     name: 'ship',        t: { en:'ship',         ru:'корабль',               es:'barco',              fr:'navire',                de:'Schiff',             zh:'船' } },
  { id: 'shoe',       name: 'shoes',       t: { en:'shoes',        ru:'туфли',                 es:'zapatos',            fr:'chaussures',            de:'Schuhe',             zh:'鞋子' } },
  { id: 'snowflake',  name: 'snow',        t: { en:'snow',         ru:'снег',                  es:'nieve',              fr:'neige',                 de:'Schnee',             zh:'雪' } },
  { id: 'sock',       name: 'socks',       t: { en:'socks',        ru:'носки',                 es:'calcetines',         fr:'chaussettes',           de:'Socken',             zh:'袜子' } },
  { id: 'shirt',      name: 't-shirt',     t: { en:'t-shirt',      ru:'футболка',              es:'camiseta',           fr:'t-shirt',               de:'T-Shirt',            zh:'T恤' } },
  { id: 'crown',      name: 'tights',      t: { en:'tights',       ru:'колготки',              es:'medias',             fr:'collants',              de:'Strumpfhose',        zh:'连裤袜' } },
  { id: 'submarine',  name: 'trailer',     t: { en:'trailer',      ru:'прицеп',                es:'remolque',           fr:'remorque',              de:'Anhänger',           zh:'拖车' } },
  { id: 'skateboard', name: 'trolleybus',  t: { en:'trolleybus',   ru:'троллейбус',            es:'trolebús',           fr:'trolleybus',            de:'Oberleitungsbus',    zh:'无轨电车' } },
  { id: 'fish',       name: 'turkey',      t: { en:'turkey',       ru:'индейка',               es:'pavo',               fr:'dinde',                 de:'Truthahn',           zh:'火鸡' } },
  { id: 'swimsuit',   name: 'turtleneck',  t: { en:'turtleneck',   ru:'водолазка',             es:'cuello alto',        fr:'col roulé',             de:'Rollkragenpullover', zh:'высокий воротник' } },
  { id: 'indigo',     name: 'violet',      t: { en:'violet',       ru:'фиолетовый',            es:'violeta',            fr:'violet',                de:'violett',            zh:'紫色' } },
  { id: 'donut',      name: 'water',       t: { en:'water',        ru:'вода',                  es:'agua',               fr:'eau',                   de:'Wasser',             zh:'水' } },
  { id: 'wasp',       name: 'worm',        t: { en:'worm',         ru:'червяк',                es:'gusano',             fr:'ver',                   de:'Wurm',               zh:'蚯蚓' } },
]

// Translations for words added via admin panel (matched by name, not ID).
// Also includes all renamed words so they are found by current name regardless of ID.
const TRANSLATIONS_BY_NAME = {
  // ── Renamed words (new names) ─────────────────────────────────────────────
  'donkey':      { en:'donkey',      ru:'осёл',               es:'burro',              fr:'âne',                   de:'Esel',               zh:'驴' },
  'eyebrow':     { en:'eyebrow',     ru:'бровь',              es:'ceja',               fr:'sourcil',               de:'Augenbraue',         zh:'眉毛' },
  'airship':     { en:'airship',     ru:'дирижабль',          es:'dirigible',          fr:'dirigeable',            de:'Luftschiff',         zh:'飞艇' },
  'avocado':     { en:'avocado',     ru:'авокадо',            es:'aguacate',           fr:'avocat',                de:'Avocado',            zh:'牛油果' },
  'boots':       { en:'boots',       ru:'сапоги',             es:'botas',              fr:'bottes',                de:'Stiefel',            zh:'靴子' },
  'chicken':     { en:'chicken',     ru:'курица',             es:'pollo',              fr:'poulet',                de:'Huhn',               zh:'鸡' },
  'cock':        { en:'cock',        ru:'петух',              es:'gallo',              fr:'coq',                   de:'Hahn',               zh:'公鸡' },
  'finger':      { en:'finger',      ru:'палец',              es:'dedo',               fr:'doigt',                 de:'Finger',             zh:'手指' },
  'gloves':      { en:'gloves',      ru:'перчатки',           es:'guantes',            fr:'gants',                 de:'Handschuhe',         zh:'手套' },
  'goat':        { en:'goat',        ru:'коза',               es:'cabra',              fr:'chèvre',                de:'Ziege',              zh:'山羊' },
  'goose':       { en:'goose',       ru:'гусь',               es:'ganso',              fr:'oie',                   de:'Gans',               zh:'鹅' },
  'hair':        { en:'hair',        ru:'волосы',             es:'cabello',            fr:'cheveux',               de:'Haare',              zh:'头发' },
  'hamster':     { en:'hamster',     ru:'хомяк',              es:'hámster',            fr:'hamster',               de:'Hamster',            zh:'仓鼠' },
  'harvester':   { en:'harvester',   ru:'комбайн',            es:'cosechadora',        fr:'moissonneuse',          de:'Mähdrescher',        zh:'收割机' },
  'legs':        { en:'legs',        ru:'ноги',               es:'piernas',            fr:'jambes',                de:'Beine',              zh:'腿' },
  'lips':        { en:'lips',        ru:'губы',               es:'labios',             fr:'lèvres',                de:'Lippen',             zh:'嘴唇' },
  'moustache':   { en:'moustache',   ru:'усы',                es:'bigote',             fr:'moustache',             de:'Schnurrbart',        zh:'胡须' },
  'mushroom':    { en:'mushroom',    ru:'гриб',               es:'seta',               fr:'champignon',            de:'Pilz',               zh:'蘑菇' },
  'light-blue':  { en:'light blue',  ru:'голубой',            es:'azul claro',         fr:'bleu clair',            de:'hellblau',           zh:'浅蓝色' },
  'parrot':      { en:'parrot',      ru:'попугай',            es:'loro',               fr:'perroquet',             de:'Papagei',            zh:'鹦鹉' },
  'police car':  { en:'police car',  ru:'полицейская машина', es:'coche de policía',   fr:'voiture de police',     de:'Polizeiauto',        zh:'警车' },
  'porridge':    { en:'porridge',    ru:'каша',               es:'gachas',             fr:'bouillie',              de:'Brei',               zh:'粥' },
  'rain':        { en:'rain',        ru:'дождь',              es:'lluvia',             fr:'pluie',                 de:'Regen',              zh:'雨' },
  'sea':         { en:'sea',         ru:'море',               es:'mar',                fr:'mer',                   de:'Meer',               zh:'海' },
  'ship':        { en:'ship',        ru:'корабль',            es:'barco',              fr:'navire',                de:'Schiff',             zh:'船' },
  'shoes':       { en:'shoes',       ru:'туфли',              es:'zapatos',            fr:'chaussures',            de:'Schuhe',             zh:'鞋子' },
  'snow':        { en:'snow',        ru:'снег',               es:'nieve',              fr:'neige',                 de:'Schnee',             zh:'雪' },
  'socks':       { en:'socks',       ru:'носки',              es:'calcetines',         fr:'chaussettes',           de:'Socken',             zh:'袜子' },
  't-shirt':     { en:'t-shirt',     ru:'футболка',           es:'camiseta',           fr:'t-shirt',               de:'T-Shirt',            zh:'T恤' },
  'tights':      { en:'tights',      ru:'колготки',           es:'medias',             fr:'collants',              de:'Strumpfhose',        zh:'连裤袜' },
  'trailer':     { en:'trailer',     ru:'прицеп',             es:'remolque',           fr:'remorque',              de:'Anhänger',           zh:'拖车' },
  'trolleybus':  { en:'trolleybus',  ru:'троллейбус',         es:'trolebús',           fr:'trolleybus',            de:'Oberleitungsbus',    zh:'无轨电车' },
  'turkey':      { en:'turkey',      ru:'индейка',            es:'pavo',               fr:'dinde',                 de:'Truthahn',           zh:'火鸡' },
  'turtleneck':  { en:'turtleneck',  ru:'водолазка',          es:'cuello alto',        fr:'col roulé',             de:'Rollkragenpullover', zh:'高领毛衣' },
  'violet':      { en:'violet',      ru:'фиолетовый',         es:'violeta',            fr:'violet',                de:'violett',            zh:'紫色' },
  'water':       { en:'water',       ru:'вода',               es:'agua',               fr:'eau',                   de:'Wasser',             zh:'水' },
  'worm':        { en:'worm',        ru:'червяк',             es:'gusano',             fr:'ver',                   de:'Wurm',               zh:'蚯蚓' },
  'Candies':     { en:'candies',     ru:'конфеты',        es:'caramelos',           fr:'bonbons',              de:'Süßigkeiten',   zh:'糖果' },
  'autumn':      { en:'autumn',      ru:'осень',          es:'otoño',               fr:'automne',              de:'Herbst',        zh:'秋天' },
  'baby':        { en:'baby',        ru:'малыш',          es:'bebé',                fr:'bébé',                 de:'Baby',          zh:'婴儿' },
  'beans':       { en:'beans',       ru:'фасоль',         es:'judías',              fr:'haricots',             de:'Bohnen',        zh:'豆子' },
  'bear':        { en:'bear',        ru:'медведь',        es:'oso',                 fr:'ours',                 de:'Bär',           zh:'熊' },
  'boy':         { en:'boy',         ru:'мальчик',        es:'niño',                fr:'garçon',               de:'Junge',         zh:'男孩' },
  'broccoli':    { en:'broccoli',    ru:'брокколи',       es:'brócoli',             fr:'brocoli',              de:'Brokkoli',      zh:'西兰花' },
  'cabbage':     { en:'cabbage',     ru:'капуста',        es:'repollo',             fr:'chou',                 de:'Kohl',          zh:'卷心菜' },
  'carrot':      { en:'carrot',      ru:'морковь',        es:'zanahoria',           fr:'carotte',              de:'Karotte',       zh:'胡萝卜' },
  'celery':      { en:'celery',      ru:'сельдерей',      es:'apio',                fr:'céleri',               de:'Sellerie',      zh:'芹菜' },
  'children':    { en:'children',    ru:'дети',           es:'niños',               fr:'enfants',              de:'Kinder',        zh:'孩子们' },
  'corn':        { en:'corn',        ru:'кукуруза',       es:'maíz',                fr:'maïs',                 de:'Mais',          zh:'玉米' },
  'crawl':       { en:'crawl',       ru:'ползти',         es:'gatear',              fr:'ramper',               de:'krabbeln',      zh:'爬行' },
  'crocodile':   { en:'crocodile',   ru:'крокодил',       es:'cocodrilo',           fr:'crocodile',            de:'Krokodil',      zh:'鳄鱼' },
  'cry':         { en:'cry',         ru:'плакать',        es:'llorar',              fr:'pleurer',              de:'weinen',        zh:'哭' },
  'deer':        { en:'deer',        ru:'олень',          es:'ciervo',              fr:'cerf',                 de:'Reh',           zh:'鹿' },
  'draw':        { en:'draw',        ru:'рисовать',       es:'dibujar',             fr:'dessiner',             de:'zeichnen',      zh:'画画' },
  'drink':       { en:'drink',       ru:'пить',           es:'beber',               fr:'boire',                de:'trinken',       zh:'喝' },
  'eat':         { en:'eat',         ru:'есть',           es:'comer',               fr:'manger',               de:'essen',         zh:'吃' },
  'eggplant':    { en:'eggplant',    ru:'баклажан',       es:'berenjena',           fr:'aubergine',            de:'Aubergine',     zh:'茄子' },
  'elephant':    { en:'elephant',    ru:'слон',           es:'elefante',            fr:'éléphant',             de:'Elefant',       zh:'大象' },
  'father':      { en:'father',      ru:'папа',           es:'padre',               fr:'père',                 de:'Vater',         zh:'爸爸' },
  'fish':        { en:'fish',        ru:'рыба',           es:'pez',                 fr:'poisson',              de:'Fisch',         zh:'鱼' },
  'fog':         { en:'fog',         ru:'туман',          es:'niebla',              fr:'brouillard',           de:'Nebel',         zh:'雾' },
  'fox':         { en:'fox',         ru:'лиса',           es:'zorro',               fr:'renard',               de:'Fuchs',         zh:'狐狸' },
  'frog':        { en:'frog',        ru:'лягушка',        es:'rana',                fr:'grenouille',           de:'Frosch',        zh:'青蛙' },
  'fur coat':    { en:'fur coat',    ru:'шуба',           es:'abrigo de piel',      fr:'manteau de fourrure',  de:'Pelzmantel',    zh:'皮草大衣' },
  'garlic':      { en:'garlic',      ru:'чеснок',         es:'ajo',                 fr:'ail',                  de:'Knoblauch',     zh:'大蒜' },
  'girl':        { en:'girl',        ru:'девочка',        es:'niña',                fr:'fille',                de:'Mädchen',       zh:'女孩' },
  'go':          { en:'go',          ru:'идти',           es:'ir',                  fr:'aller',                de:'gehen',         zh:'走' },
  'grandfather': { en:'grandfather', ru:'дедушка',        es:'abuelo',              fr:'grand-père',           de:'Großvater',     zh:'爷爷' },
  'grandmother': { en:'grandmother', ru:'бабушка',        es:'abuela',              fr:'grand-mère',           de:'Großmutter',    zh:'奶奶' },
  'hedgehog':    { en:'hedgehog',    ru:'ёжик',           es:'erizo',               fr:'hérisson',             de:'Igel',          zh:'刺猬' },
  'ice':         { en:'ice',         ru:'лёд',            es:'hielo',               fr:'glace',                de:'Eis',           zh:'冰' },
  'juice':       { en:'juice',       ru:'сок',            es:'jugo',                fr:'jus',                  de:'Saft',          zh:'果汁' },
  'lion':        { en:'lion',        ru:'лев',            es:'león',                fr:'lion',                 de:'Löwe',          zh:'狮子' },
  'meat':        { en:'meat',        ru:'мясо',           es:'carne',               fr:'viande',               de:'Fleisch',       zh:'肉' },
  'milk':        { en:'milk',        ru:'молоко',         es:'leche',               fr:'lait',                 de:'Milch',         zh:'牛奶' },
  'monkey':      { en:'monkey',      ru:'обезьяна',       es:'mono',                fr:'singe',                de:'Affe',          zh:'猴子' },
  'mother':      { en:'mother',      ru:'мама',           es:'madre',               fr:'mère',                 de:'Mutter',        zh:'妈妈' },
  'olives':      { en:'olives',      ru:'оливки',         es:'aceitunas',           fr:'olives',               de:'Oliven',        zh:'橄榄' },
  'onion':       { en:'onion',       ru:'лук',            es:'cebolla',             fr:'oignon',               de:'Zwiebel',       zh:'洋葱' },
  'overall':     { en:'overall',     ru:'комбинезон',     es:'mono',                fr:'combinaison',          de:'Overall',       zh:'工装裤' },
  'paddle':      { en:'paddle',      ru:'весло',          es:'remo',                fr:'pagaie',               de:'Paddel',        zh:'桨' },
  'peas':        { en:'peas',        ru:'горох',          es:'guisantes',           fr:'petits pois',          de:'Erbsen',        zh:'豌豆' },
  'pepper':      { en:'pepper',      ru:'перец',          es:'pimiento',            fr:'poivron',              de:'Paprika',       zh:'辣椒' },
  'pie':         { en:'pie',         ru:'пирог',          es:'pastel',              fr:'tarte',                de:'Kuchen',        zh:'馅饼' },
  'play':        { en:'play',        ru:'играть',         es:'jugar',               fr:'jouer',                de:'spielen',       zh:'玩' },
  'potato':      { en:'potato',      ru:'картошка',       es:'patata',              fr:'pomme de terre',       de:'Kartoffel',     zh:'土豆' },
  'pumpkin':     { en:'pumpkin',     ru:'тыква',          es:'calabaza',            fr:'citrouille',           de:'Kürbis',        zh:'南瓜' },
  'radish':      { en:'radish',      ru:'редиска',        es:'rábano',              fr:'radis',                de:'Radieschen',    zh:'萝卜' },
  'read':        { en:'read',        ru:'читать',         es:'leer',                fr:'lire',                 de:'lesen',         zh:'读' },
  'rhino':       { en:'rhino',       ru:'носорог',        es:'rinoceronte',         fr:'rhinocéros',           de:'Nashorn',       zh:'犀牛' },
  'run':         { en:'run',         ru:'бежать',         es:'correr',              fr:'courir',               de:'rennen',        zh:'跑' },
  'sand':        { en:'sand',        ru:'песок',          es:'arena',               fr:'sable',                de:'Sand',          zh:'沙子' },
  'sandals':     { en:'sandals',     ru:'сандалии',       es:'sandalias',           fr:'sandales',             de:'Sandalen',      zh:'凉鞋' },
  'sausage':     { en:'sausage',     ru:'сосиска',        es:'salchicha',           fr:'saucisse',             de:'Wurst',         zh:'香肠' },
  'say':         { en:'say',         ru:'говорить',       es:'decir',               fr:'dire',                 de:'sagen',         zh:'说' },
  'scream':      { en:'scream',      ru:'кричать',        es:'gritar',              fr:'crier',                de:'schreien',      zh:'尖叫' },
  'seat':        { en:'seat',        ru:'сиденье',        es:'asiento',             fr:'siège',                de:'Sitz',          zh:'座位' },
  'shorts':      { en:'shorts',      ru:'шорты',          es:'pantalones cortos',   fr:'short',                de:'Shorts',        zh:'短裤' },
  'skirt':       { en:'skirt',       ru:'юбка',           es:'falda',               fr:'jupe',                 de:'Rock',          zh:'裙子' },
  'sleep':       { en:'sleep',       ru:'спать',          es:'dormir',              fr:'dormir',               de:'schlafen',      zh:'睡觉' },
  'slippers':    { en:'slippers',    ru:'тапочки',        es:'zapatillas',          fr:'chaussons',            de:'Hausschuhe',    zh:'拖鞋' },
  'smile':       { en:'smile',       ru:'улыбаться',      es:'sonreír',             fr:'sourire',              de:'lächeln',       zh:'微笑' },
  'snake':       { en:'snake',       ru:'змея',           es:'serpiente',           fr:'serpent',              de:'Schlange',      zh:'蛇' },
  'sneakers':    { en:'sneakers',    ru:'кроссовки',      es:'zapatillas',          fr:'baskets',              de:'Turnschuhe',    zh:'运动鞋' },
  'soil':        { en:'soil',        ru:'земля',          es:'tierra',              fr:'sol',                  de:'Erde',          zh:'土壤' },
  'squirrel':    { en:'squirrel',    ru:'белка',          es:'ardilla',             fr:'écureuil',             de:'Eichhörnchen',  zh:'松鼠' },
  'stay':        { en:'stay',        ru:'стоять',         es:'quedarse',            fr:'rester',               de:'bleiben',       zh:'留下' },
  'stone':       { en:'stone',       ru:'камень',         es:'piedra',              fr:'pierre',               de:'Stein',         zh:'石头' },
  'suit':        { en:'suit',        ru:'костюм',         es:'traje',               fr:'costume',              de:'Anzug',         zh:'西装' },
  'swim':        { en:'swim',        ru:'плавать',        es:'nadar',               fr:'nager',                de:'schwimmen',     zh:'游泳' },
  'tea':         { en:'tea',         ru:'чай',            es:'té',                  fr:'thé',                  de:'Tee',           zh:'茶' },
  'tiger':       { en:'tiger',       ru:'тигр',           es:'tigre',               fr:'tigre',                de:'Tiger',         zh:'老虎' },
  'tomato':      { en:'tomato',      ru:'помидор',        es:'tomate',              fr:'tomate',               de:'Tomate',        zh:'番茄' },
  'wolf':        { en:'wolf',        ru:'волк',           es:'lobo',                fr:'loup',                 de:'Wolf',          zh:'狼' },
  'zebra':       { en:'zebra',       ru:'зебра',          es:'cebra',               fr:'zèbre',                de:'Zebra',         zh:'斑马' },
  'zucchini':    { en:'zucchini',    ru:'кабачок',        es:'calabacín',           fr:'courgette',            de:'Zucchini',      zh:'西葫芦' },
}

/**
 * Seed translations into the given pg pool.
 * Only updates words that have empty translations ({}).
 * Safe to call on every server start.
 */
export async function seedTranslations(dbPool) {
  let updated = 0

  // Pass 1: match by ID (original seeded words)
  const ids = Object.keys(TRANSLATIONS)
  for (const id of ids) {
    const result = await dbPool.query(
      `UPDATE words SET translations = $1
       WHERE id = $2 AND (translations IS NULL OR translations = '{}')`,
      [JSON.stringify(TRANSLATIONS[id]), id]
    )
    if (result.rowCount > 0) updated++
  }

  // Pass 2: match by name — only if translations are empty (preserves manual edits)
  const names = Object.keys(TRANSLATIONS_BY_NAME)
  for (const name of names) {
    const result = await dbPool.query(
      `UPDATE words SET translations = $1
       WHERE LOWER(name) = LOWER($2) AND (translations IS NULL OR translations = '{}')`,
      [JSON.stringify(TRANSLATIONS_BY_NAME[name]), name]
    )
    if (result.rowCount > 0) updated++
  }

  // Pass 3: fix renamed words — matched by BOTH id AND current name (for rows
  // where id was NOT manually changed). Also try match by name only as fallback.
  for (const entry of TRANSLATIONS_RENAMED) {
    // Try id+name first (most precise) — only if translations are empty
    let result = await dbPool.query(
      `UPDATE words SET translations = $1
       WHERE id = $2 AND LOWER(name) = LOWER($3) AND (translations IS NULL OR translations = '{}')`,
      [JSON.stringify(entry.t), entry.id, entry.name]
    )
    if (result.rowCount > 0) { updated++; continue }
    // Fallback: name only (handles case where admin also changed the id manually)
    result = await dbPool.query(
      `UPDATE words SET translations = $1
       WHERE LOWER(name) = LOWER($2) AND (translations IS NULL OR translations = '{}' OR translations::text = '')`,
      [JSON.stringify(entry.t), entry.name]
    )
    if (result.rowCount > 0) updated++
  }

  if (updated > 0) console.log(`[seed] Populated translations for ${updated} words.`)
}

// ── Standalone runner ──────────────────────────────────────────────────────
if (process.argv[1].endsWith('seed-translations.js')) {
  const { Pool } = pg
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const ids = Object.keys(TRANSLATIONS)
  let updated = 0, skipped = 0
  for (const id of ids) {
    const r = await pool.query(
      `UPDATE words SET translations = $1 WHERE id = $2`,
      [JSON.stringify(TRANSLATIONS[id]), id]
    )
    r.rowCount > 0 ? updated++ : (skipped++, console.warn(`Not found: "${id}"`))
  }
  console.log(`Done: ${updated} updated, ${skipped} not found.`)
  await pool.end()
}
