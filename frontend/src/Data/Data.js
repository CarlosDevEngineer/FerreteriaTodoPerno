// Sidebar imports
import {
  UilEstate,
  UilClipboardAlt,
  UilUsersAlt,
  UilPackage,
  UilShoppingBag,
  UilBill,
  UilBox,
  UilTruck,
  UilFlask,

} from "@iconscout/react-unicons";

// Analytics Cards imports
import { UilUsdSquare, UilMoneyWithdrawal } from "@iconscout/react-unicons";


// Recent Card Imports
import img1 from "../imgs/img1.png";
import img2 from "../imgs/img2.png";
import img3 from "../imgs/img3.png";

// Sidebar Data
export const SidebarData = [
  {
    icon: UilEstate,
    heading: "Dashboard",
    path: "/",
    roles: ["admin", "user","ventas"]
  },
  {
    icon: UilUsersAlt,
    heading: "Usuarios",
    path: "/usuario",
    roles: ["admin"]
  },
  {
    icon: UilUsersAlt,
    path: '/clientes',
    heading: 'Clientes',
    roles: ["admin","ventas"]
  },
  {
    icon: UilPackage,
    heading: "Productos",
    path:"/producto",
    roles: ["admin"]
  },
  {
    icon: UilShoppingBag,
    path: "/compras",
    heading: 'Compras',
    roles: ["admin"]
  },
   {
    icon: UilBill,
    heading: 'Ventas',
    path: '/ventas',
    roles: ["admin", "ventas"]
  },
  {
    icon: UilBox,
    heading: 'Inventario',
    path: '/inventario',
    roles: ["admin", "ventas"]
  },
  
  {
    icon: UilTruck,
    path: '/proveedor',
    heading: 'Proveedores',
    roles: ["admin"]
  },
 
];

// Analytics Cards Data
export const cardsData = [
  {
    title: "Ventas",
    color: {
      backGround: "linear-gradient(180deg, #bb67ff 0%, #c484f3 100%)",
      boxShadow: "0px 10px 20px 0px #e0c6f5",
    },
    barValue: 70,
    value: "25,970",
    png: UilUsdSquare,
    series: [
      {
        name: "Ventas",
        data: [31, 40, 28, 51, 42, 109, 100],
      },
    ],
  },
  {
    title: "Compras",
    color: {
      backGround: "linear-gradient(180deg, #FF919D 0%, #FC929D 100%)",
      boxShadow: "0px 10px 20px 0px #FDC0C7",
    },
    barValue: 80,
    value: "14,270",
    png: UilMoneyWithdrawal,
    series: [
      {
        name: "Compras",
        data: [10, 100, 50, 70, 80, 30, 40],
      },
    ],
  },
  {
    title: "Productos",
    color: {
      backGround:
        "linear-gradient(rgb(248, 212, 154) -146.42%, rgb(255 202 113) -46.42%)",
      boxShadow: "0px 10px 20px 0px #F9D59B",
    },
    barValue: 60,
    value: "4,270",
    png: UilClipboardAlt,
    series: [
      {
        name: "productos",
        data: [10, 25, 15, 30, 12, 15, 20],
      },
    ],
  },
];

// Recent Update Card Data
export const UpdatesData = [
  {
    img: img1,
    name: "Andrew Thomas",
    noti: "Una buena orden.",
    time: "25 seconds ago",
  },
  {
    img: img2,
    name: "James Bond",
    noti: "Excelentes productos",
    time: "30 minutes ago",
  },
  {
    img: img3,
    name: "Iron Man",
    noti: "Super rápido, como siempre.",
    time: "2 hours ago",
  },
];
