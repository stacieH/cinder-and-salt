import { Dish } from '@/types';

export const dishes: Dish[] = [
  {
    id: 'octopus',
    name: 'Charred Octopus & Chorizo',
    description: 'Tender octopus charred over live flame with smoky chorizo and a squeeze of lemon.',
    course: 'starters',
    price: 780,
    image:
      'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'tuna-crudo',
    name: 'Seared Tuna Crudo',
    description: 'Thin-sliced tuna, briefly seared, with citrus, chili oil and crisp shallots.',
    course: 'starters',
    price: 900,
    image:
      'https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'beet-burrata',
    name: 'Heirloom Beet & Burrata',
    description: 'Roasted heirloom beets, creamy burrata, candied walnuts and basil oil.',
    course: 'starters',
    price: 650,
    image:
      'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'sourdough',
    name: 'Smoked Sourdough & Whipped Butter',
    description: 'House sourdough toasted over the grill, served with flake-salt whipped butter.',
    course: 'starters',
    price: 480,
    image:
      'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'ribeye',
    name: 'Dry-Aged Ribeye',
    description: 'Dry-aged ribeye grilled over live flame and rested, with red wine jus.',
    course: 'mains',
    price: 1980,
    image:
      'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'lobster',
    name: 'Wood-Fired Lobster Tail',
    description: 'Split lobster tail grilled over hardwood and brushed with garlic-herb butter.',
    course: 'mains',
    price: 1650,
    image:
      'https://images.unsplash.com/photo-1775204109618-3fd68eb8f2a6?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'filet',
    name: 'Truffle Butter Filet',
    description: 'Center-cut beef filet, seared and finished with black truffle butter.',
    course: 'mains',
    price: 1680,
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'pork-ribs',
    name: 'Smoked Pork Ribs',
    description: 'Low-and-slow smoked pork ribs, glazed and finished over the flame.',
    course: 'mains',
    price: 1280,
    image:
      'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'salmon',
    name: 'Grilled Salmon, Charred Lemon',
    description: 'Grilled salmon with charred lemon and a dill-caper relish.',
    course: 'mains',
    price: 1250,
    image:
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'ravioli',
    name: 'Wild Mushroom Truffle Ravioli',
    description: 'House-made ravioli filled with wild mushrooms, in a light truffle cream.',
    course: 'mains',
    price: 1080,
    image:
      'https://images.unsplash.com/photo-1636475735446-bfc801fa6f2c?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'half-chicken',
    name: 'Roasted Half Chicken',
    description: 'Brined half chicken roasted until crisp-skinned, with pan jus.',
    course: 'mains',
    price: 1150,
    image:
      'https://images.unsplash.com/photo-1562967914-608f82629710?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'quinoa-bowl',
    name: 'Quinoa & Roasted Root Bowl',
    description: 'Quinoa with roasted seasonal roots and a lemon-tahini dressing.',
    course: 'sides',
    price: 380,
    image:
      'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'broccolini',
    name: 'Charred Broccolini & Almonds',
    description: 'Charred broccolini with toasted almonds and chili flakes.',
    course: 'sides',
    price: 320,
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'lava-cake',
    name: 'Chocolate Lava Cake',
    description: 'Warm dark-chocolate cake with a molten center and vanilla ice cream.',
    course: 'desserts',
    price: 380,
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1200&q=80&auto=format&fit=crop',
    signature: true,
  },
  {
    id: 'tiramisu',
    name: 'Classic Tiramisu',
    description: 'Espresso-soaked ladyfingers layered with mascarpone and cocoa.',
    course: 'desserts',
    price: 360,
    image:
      'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'cannoli',
    name: 'Pistachio Cannoli',
    description: 'Crisp shells filled with sweet ricotta and crushed pistachio.',
    course: 'desserts',
    price: 320,
    image:
      'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'panna-cotta',
    name: 'Lemon Panna Cotta',
    description: 'Silky lemon panna cotta with a bright berry compote.',
    course: 'desserts',
    price: 340,
    image:
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'old-fashioned',
    name: 'Barrel-Aged Old Fashioned',
    description: 'Bourbon and bitters, barrel-aged for a smooth, rounded finish.',
    course: 'drinks',
    price: 480,
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
  {
    id: 'vanilla-latte',
    name: 'Iced Vanilla Latte',
    description: 'Espresso over ice with cold milk and house vanilla syrup.',
    course: 'drinks',
    price: 160,
    image:
      'https://images.unsplash.com/photo-1590412200988-a436970781fa?w=1200&q=80&auto=format&fit=crop',
    signature: false,
  },
];
