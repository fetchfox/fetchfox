import { fox, S3KV } from '../../src/index.js';
import { srid } from '../../src/util.js';
import { Item } from '../../src/item/Item.js'
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract bidspotter.com', async function() {
  const matrix = standardMatrix();

  const prefixes = [
    // 'benchkv/fixed-2/',
    `benchkv/random-${srid()}/`,
  ];

  const expected = [
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '1',
      product_title: 'NIB HP Engage One Pro All in One 24" All in One Touch Screen System Core i5 w/ Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/3f881ada-1fff-4316-b936-b2a0014826a6.jpg?h=175',
      current_bid: '$50.00',
      opening_bid: '',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-6793a426-bde0-42a9-9ea0-b2a0013dd520'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '2',
      product_title: 'NIB HP Engage One Pro All in One 24" Touch Screen System Core i5 w/ Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/76cdd71e-6692-4245-986b-b2a0014822a5.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-c58d85cb-0f05-4c7e-b9a8-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '3',
      product_title: 'NIB HP Engage One Pro All in One 24" Touch Screen System Core i5 w/ Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/ccc79fac-77fc-42bb-a7c1-b2a001481c79.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-bf005a10-30f4-4214-8298-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '4',
      product_title: 'NIB HP Engage One Pro All in One 24" Touch Screen System Core i5 w/ Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/7937f5d6-3b26-44b0-8776-b2a0014813bb.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-bbb54be7-b800-4e8b-a398-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '5',
      product_title: 'HP Engage One Pro All in One 24" Touch Screen System Core i5 w/ Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/7e7ade2a-2ce7-490e-88fb-b2a001480b7d.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '6',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/5c5a3e03-01e9-4914-88db-b2a001486718.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-81f0911d-9492-4c23-9e83-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '7',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/f6e5f807-d4ec-4aa6-8150-b2a00148a025.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-0309e9da-2f84-42a4-a17a-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '8',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/d71a2c87-7899-41a2-8103-b2a00148ad9b.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '9',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/401740ff-7ae7-4914-bfd9-b2a0014845ad.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-a0f41652-0384-4d3f-9178-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '10',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/9e86fed6-9bc2-462a-8895-b2a00148c5be.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-294a37cd-f596-405c-a7a7-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '11',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/40bee6ea-55f6-4bd5-a837-b2a001485198.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '12',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/9c0e0308-3365-4367-ad9c-b2a00148db85.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '13',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/f149def1-0999-4b29-934d-b2a001485ca5.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-6e5c991e-dc5a-4816-ab41-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '14',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/4b176bdd-f0af-485e-b3e4-b2a001486338.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '15',
      product_title: 'NIB HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/519e3ed6-558b-4a5f-83dc-b2a001488fd2.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-b4e75a5e-5be5-4fb7-8781-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '16',
      product_title: 'HP Engage Pro All in One 19" All In One Touch Screen Core i5',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/0f75663a-db6e-4be3-9e7d-b2a00148656b.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-c3c1c576-a9ab-44e3-8049-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '17',
      product_title: "(4) Lenovo Think Centre As-Is All In One PC's",
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/947c0b19-4577-4d08-9a88-b2a5017ff456.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-f8da4da2-b98e-4c78-8bd3-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '18',
      product_title: "(4) Dell Core i7 All In One PC's",
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/efe9bfdf-78bf-4c1b-a790-b2a5017ff045.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-2bc96066-328f-432c-a1f4-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '19',
      product_title: '(Lot) Photography Tripods',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/b5e40baf-9a99-4941-9123-b2a5017fe947.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-2b9972c2-d773-4aae-82df-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '20',
      product_title: 'Ritter 304 Exam Table',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/568a634e-38d7-4222-85f5-b2a5017fe2b1.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-853dc782-f04d-42c3-ad6d-b2a0013dd51f'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '21',
      product_title: '(4) Upholstered Bucket Chairs (Assembly Required)',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/9775d90e-414f-4495-8528-b2a5017fdff9.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-359e0e6f-b0d6-4360-800f-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '22',
      product_title: 'Zoll AED Plus w/ Wall Cabinet',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/57338002-44d7-468a-bbe8-b2a5017fda58.jpg?h=175',
      current_bid: '$100.00',
      opening_bid: '',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-e71bf344-ab49-4b1e-9c1e-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '23',
      product_title: 'Maxnet 42" Flat Panel TV',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/94a4582b-745b-4af4-9fa5-b2a5017fd607.jpg?h=175',
      current_bid: '',
      opening_bid: '$50',
      ends_in: '2025-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-d5ec50a2-4354-48af-a1aa-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '24',
      product_title: '(35) Asst. Medical Carts',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/727da079-417c-4964-b4ce-b2a5017fce9c.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-5f4a79a2-6587-4078-9407-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '25',
      product_title: 'TrippLite SRCOOL 12K Portable Room AC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/c69dac9e-89e5-4de9-abaa-b2a5017fc782.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-8bfcd35a-53d9-4628-9d79-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '26',
      product_title: '(Lot) Trade Show Booth',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/c0dda3d6-314c-4ab6-9830-b2a5017fc315.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-01eac3d4-c315-402a-9c8e-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '27',
      product_title: '(6) Asst. Lateral Files',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/03163843-20e9-417f-ae70-b2a5017fbe80.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-e7fa51ee-ec5f-4e4f-94c7-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '28',
      product_title: 'Howard Medical Cart w/ DT Research #584TM, Touch Screen Monitor w/ Windows 11, and Conference',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/924c90ac-1024-433a-84a3-b2a5017fbba7.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-acd46e5d-875c-4c54-bcbb-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '29',
      product_title: '(Lot) Asst. As-Is Mini Pc/s and Laptops (Dell, HP, Think Centre and Asst.)',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/0d2b9f3b-289e-4803-8357-b2a5017fb8f2.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-693bd2f7-fde0-4a56-a9fa-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '30',
      product_title: '(2) Holter and ECG Monitors',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/acdda7e9-2fc1-4451-be82-b2a5017fb1f4.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-0207aca3-e6c7-4cf2-960b-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '31',
      product_title: '(3) AMD Scaler 2500 Camera',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/ff2366c7-8231-40ff-9fa0-b2a5017fab89.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-28e55d28-4c77-46a4-9feb-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '32',
      product_title: '(7) Howard and Asst. Medical Carts w/ Fujitsu Touch Screen Tablets Intel I5 and Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/6c7dae93-e5f2-43df-87a4-b2a5017fa8ba.jpg?h=175',
      current_bid: '',
      opening_bid: '$300.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-162e4976-654c-4a9b-b365-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '33',
      product_title: '(6) Howard and Asst. Medical Carts w/ Fujitsu Touch Screen Tablets Intel I5 and Windows 10 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/7cec87f4-bf8f-4d07-a57a-b2a5017fa304.jpg?h=175',
      current_bid: '',
      opening_bid: '$300.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-ce4fdedf-dfb3-4c18-a064-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '34',
      product_title: '(6) Howard and Asst. Medical Carts w/ Fujitsu Touch Screen Tablets Intel I5 and Windows 11 Pro',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/8a089ae7-660d-41e6-80c1-b2a001486c65.jpg?h=175',
      current_bid: '',
      opening_bid: '$300.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-823cf512-86ae-4a4c-96a6-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '35',
      product_title: '(9) AMD Medical Carts w Keys',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/7ccaa86e-70f7-4de3-8133-b2a001487b48.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-0c89e708-209f-4c41-a6b9-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '36',
      product_title: "(2) Medical Carts w/ (2) Asst. Touch Screen All In One PC's (No Power)",
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/7f0d269d-bc48-4095-b225-b2a001488476.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '37',
      product_title: '(Lot) Asst. Polycom Equipment in 5 Boxes',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/691f7d7e-1fa7-4b8f-a76d-b2a0014930ce.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-9cc0513d-29b7-4de9-87c0-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '38',
      product_title: '(Lot) Asst. Hardware and Shelf',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/6fe2c38b-84af-4f6c-822c-b2a001489696.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-90918d77-49ec-4cd4-bd48-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '39',
      product_title: 'New Open Box HP Engage 13.5" Convertible System Prototype',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/c084085f-dfb1-4c85-9594-b2a001489e0e.jpg?h=175',
      current_bid: '',
      opening_bid: '$50',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-9278cfec-9021-48bf-a16b-b2a0013dd51e'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '40',
      product_title: '(Lot) Asst. Cables',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/227f268f-1932-40c0-98e7-b2a00148a3b1.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '41',
      product_title: '(3) New Open Box Welch Allyn Vital Sign 300 and Xli Monitors',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/1fec8728-3e61-4c56-b809-b2a00148b017.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-6467ba1e-aa54-4b9d-bded-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '42',
      product_title: '(2) NIB Dell OptiPlex #7090 Micro Core i7 PC w/ Keyboard',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/732899ad-eac9-4f99-a4f9-b2a00148b573.jpg?h=175',
      current_bid: '$100.00',
      opening_bid: '',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-2f7ff982-2a47-401b-9bd8-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '43',
      product_title: '(2) NIB Dell OptiPlex #7090 Micro Core i7 PC w/ Keyboard',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/96172d42-758c-4011-8a98-b2a00148b9df.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-97d8a5c6-cfbc-462f-82d6-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '44',
      product_title: '(2) NIB Dell OptiPlex #7090 Micro Core i7 PC w/ Keyboard',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/165b97b5-f1bc-4476-b4a2-b2a00148beda.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-af006ccf-8390-4d18-b0f9-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '45',
      product_title: '(2) NIB Dell OptiPlex #7090 Micro Core i7 PC w/ Keyboard',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/402481b2-814a-403d-81a8-b2a00148c31a.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-adbf1d7a-d338-409b-b30e-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '46',
      product_title: '(2) (1) NIB and (1) New Open Box Dell Opti 7090 Micro Core i7 PC w/ Keyboard',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/fef47189-d9ae-4fa3-8f7c-b2a00148c75d.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-4432cff9-770f-4750-8a4d-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '47',
      product_title: 'NIB HP Engage Go 13.5" PC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/a62ce448-0c84-4fcb-b499-b2a00148cc71.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '48',
      product_title: 'NIB HP Engage Go 13.5" PC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/b602a9ac-79e1-4596-934b-b2a00148d132.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-47e29b26-6ba5-4845-ab4c-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '49',
      product_title: 'NIB HP Engage Go 13.5" PC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/37f2fde5-6147-4e21-81ed-b2a00148d4ce.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-800462c9-c368-4fb1-9c11-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '50',
      product_title: 'NIB HP Engage Go 13.5" PC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/3b497219-59ed-49ce-94f3-b2a00148d7ad.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-d7fbfa54-687d-441b-8b2e-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '51',
      product_title: 'NIB HP Engage Go 13.5" PC',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/e6d5da3c-9f03-4760-b9bc-b2a00148da64.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-da99d4f3-690d-4330-8949-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '52',
      product_title: '(2) NIB IQcal By Midmark 3 Litre Calibration Syringe',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/dbd11157-b40c-420c-8f90-b2a00148dd19.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-1cec6b1f-d1a8-4724-94cf-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '53',
      product_title: '(2) NIB IQcal By Midmark 3 Litre Calibration Syringe',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/173f64fe-5df5-4e0b-bb44-b2a00148e0af.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2023-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-fbea1cb7-a24d-4475-ae14-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '54',
      product_title: '(2) NIB IQcal By Midmark 3 Litre Calibration Syringe',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/2c380914-2e09-444d-bc6f-b2a00148e36b.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-bb1d98c1-7379-4ec2-9857-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '55',
      product_title: '(31) Asst. Logitech and Ausdom PC Cameras',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/828ec39d-92a4-44b0-8ea5-b2a00148e61b.jpg?h=175',
      current_bid: '',
      opening_bid: '$100.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-1e05ca3d-d047-4b0d-b484-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '56',
      product_title: '(29) Digital Pens #ACC00735',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/d5f5ff22-2c0f-4f23-9f88-b2a00148ea29.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '57',
      product_title: '(Lot) Approximately (60) IO Gear 4 Port Hubs',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/fedd4968-2348-41c1-a596-b2a00148efe9.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Location: Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-843a8797-01e0-4ae8-9bbe-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '58',
      product_title: '(7) Asst. Monitors',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/24e54848-87d1-4614-81ba-b2a00148f502.jpg?h=175',
      current_bid: '',
      opening_bid: '$50.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-74b617ab-211a-49ee-82af-b2a0013dd51d'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '59',
      product_title: '(Lot) Specula and Asst. Disposable Supplies',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/5ed9b674-ba9f-4f4d-bfa7-b2a00148f8cc.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-51292941-7205-4814-9532-b2a0013dd51c'
    },
    {
      auctioneer_name: 'Paul E. Saperstein Co., Inc.',
      lot_number: '60',
      product_title: 'Cisco TTC8-02 Camera',
      main_lot_image_url: 'https://portal-images.azureedge.net/auctions-2025/bscpau10317/images/0f0475bb-e841-4c25-a2a7-b2a001490271.jpg?h=175',
      current_bid: '',
      opening_bid: '$30.00',
      ends_in: '2024-04-04',
      location: 'Chelmsford, Massachusetts',
      url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317/lot-4c7a0adb-af1f-4f99-8492-b2a0013dd51c'
    }
  ];

  const cases = [
    // {
    //   name: 'live',
    //   url: 'https://www.bidspotter.com/en-us/auction-catalogues/bscpau/catalogue-id-bscpau10317',
    //   expected,
    //   maxPages: 10,
    // },

    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/juojgjpm3w/https-www-bidspotter-com-en-us-auction-catalogues-bscpau-catalogue-id-bscpau10317.html',
      expected,
      maxPages: 1,
    },
  ];

  const questions = {
    auctioneer_name: 'What is the auctioneer name?',
    lot_number: 'What is the lot number?',
    product_title: 'What is the product title?',
    main_lot_image_url: 'What is the main lot image URL?',
    current_bid: 'What is the current bid? Format: $XX.XX, or blank if none',
    opening_bid: 'What is the opening bid? $XX.XX, or blank if none',
    ends_in: 'When does the auction end? Format: YYYY-DD-MM',
    location: 'What is the location?',
    url: 'What is the URL of this lot? Format: Absolute URL',
  };

  for (const prefix of prefixes) {
    for (const { name, url, expected, maxPages } of cases) {
      const wf = await fox
        .init(url)
        .extract({ questions, maxPages })
        .limit(500)
        .plan();

      return itRunMatrix(
        it,
        `extract extract bidspotter.com (${name})`,
        wf.dump(),
        matrix,
        [
          (items) => {
            // console.log(items.map(it => new Item(it).publicOnly()));
            console.log(items.length);
            return checkItemsAI(items, expected, questions);
          }
        ],
        {
          shouldSave: true,
          kv: new S3KV({
            bucket: 'ffcloud',
            prefix,
            acl: 'public-read',
          }),
        });
    }
  }
});
