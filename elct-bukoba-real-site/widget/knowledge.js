// Auto-generated from knowledge_base.json — client-side prototype data source.
const KB = {
  "meta": {
    "hotel_name": "ELCT Bukoba Hotel & Tours",
    "tagline": "Home of Tranquility",
    "currency_note": "Prices as published on the website: rooms and menu items quoted in USD (foreigners) and TZS (residents) where given; some items only have a USD price on the site.",
    "last_verified_from_site": "site pages downloaded by hotel staff, not live-scraped — treat as needing periodic re-sync",
    "languages": [
      "en",
      "sw",
      "fr",
      "de"
    ]
  },
  "organization": {
    "name": "ELCT Bukoba Hotel & Tours",
    "affiliation": "Operated under the Evangelical Lutheran Church in Tanzania (ELCT), North Western Diocese (NWD)",
    "description": "ELCT Bukoba Hotel and Tours is a hotel service provider and tours business located in Bukoba Town along Old Airport Road, near the Regional Commissioner's office. It is about 200m from the shore of Lake Victoria (the world's second-largest freshwater lake) and about 50m from the ELCT North Western Diocese Head Office.",
    "mission_note": "Main goal is to provide unforgettable, constructive services to customers; invites guests to hold meetings in its conference halls with garden and catering services, delicious meals, and comfortable accommodation at a competitive price.",
    "core_values": [
      {
        "name": "Excellence",
        "description": "Strives for the highest standards in service delivery, facilities, and guest experience."
      },
      {
        "name": "Hospitality",
        "description": "Welcomes every guest as family, rooted in Christian values, creating an inviting atmosphere where everyone feels respected and cared for."
      },
      {
        "name": "Attention to Detail",
        "description": "Takes pride in getting the small things right, from room cleanliness to breakfast freshness."
      },
      {
        "name": "Integrity",
        "description": "Operates with honesty, transparency, and accountability; guests can trust the hotel to deliver what it promises."
      },
      {
        "name": "Personalization",
        "description": "Takes time to understand each guest's individual needs and tailor service accordingly."
      }
    ],
    "amenities_general": [
      "Meals and drinks for customers",
      "Free private parking with maximum security in the compound",
      "Curio Shop with traditional wear, art crafts and handicrafts from Kagera, made by locals and from neighboring countries (Rwanda, Kenya, Uganda, Burundi)"
    ],
    "reviews_note": "Publicly visible guest reviews (e.g. on TripAdvisor) mention friendly service, clean rooms, good Wi-Fi, and good breakfast; the assistant should NOT quote or fabricate review content — this note is context only, not verbatim material to repeat to users."
  },
  "locations": [
    {
      "id": "bukoba_main",
      "name": "ELCT Bukoba Hotel & Tours (Main)",
      "city": "Bukoba",
      "address": "Pwani Street, Near RAS Kagera Office, Bukoba, Kagera",
      "latitude": -1.3361894271520105,
      "longitude": 31.81880128716314,
      "notes": "Primary property; on the shore of Lake Victoria, near the ELCT North Western Diocese Head Office."
    },
    {
      "id": "annex",
      "name": "ELCT Bukoba Hotel & Tours - Annex",
      "city": "Bukoba",
      "address": "Bukoba, Kagera (exact street address not published on site — confirm with hotel)",
      "latitude": -1.3333272287966296,
      "longitude": 31.79454004249812,
      "notes": "Secondary property in Bukoba, selectable as its own location in the booking system."
    },
    {
      "id": "chato",
      "name": "ELCT Hotel - Chato",
      "city": "Chato",
      "address": "Chato, Geita Region (exact street address not published on site — confirm with hotel)",
      "latitude": -2.637910878859922,
      "longitude": 31.77120360723499,
      "notes": "Property in Chato, selectable as its own location in the booking system."
    }
  ],
  "contact": {
    "address": "Pwani Street, Near RAS Kagera Office, Bukoba, Kagera",
    "phones": [
      "+255 754 415 404",
      "+255 655 184 440",
      "+255 745 415 404",
      "+255 766 184 434"
    ],
    "whatsapp": "+255 655 184 440",
    "emails": [
      "info@elctbukobahotelandtours.com",
      "elctbukobahotel@gmail.com"
    ],
    "social": [
      "Facebook",
      "X (Twitter)",
      "Instagram"
    ],
    "note": "Multiple phone numbers are published across different pages of the site; present the general reservations number first (+255 754 415 404) and mention WhatsApp is available on +255 655 184 440."
  },
  "rooms": [
    {
      "name": "Suit Plus Room",
      "features": [
        "1 Large Bed",
        "Fridge",
        "Living Room",
        "Free WiFi"
      ],
      "capacity_guests": 2,
      "beds": 1,
      "price_foreigner_usd": 100,
      "price_resident_tzs": 150000
    },
    {
      "name": "Double Room",
      "features": [
        "1 Large Bed",
        "2 small bottles of water",
        "Free WiFi"
      ],
      "capacity_guests": 2,
      "beds": 1,
      "price_foreigner_usd": 50,
      "price_resident_tzs": 55000
    },
    {
      "name": "Single Deluxe Room",
      "features": [
        "Large Bed",
        "1 small bottle of water",
        "Kettle",
        "Table & Chair",
        "Free WiFi"
      ],
      "capacity_guests": 1,
      "beds": 1,
      "price_foreigner_usd": 45,
      "price_resident_tzs": 45000
    },
    {
      "name": "Twin Room",
      "features": [
        "2 Beds",
        "2 small bottles of water",
        "Free WiFi"
      ],
      "capacity_guests": 2,
      "beds": 2,
      "price_foreigner_usd": 50,
      "price_resident_tzs": 55000
    },
    {
      "name": "Executive Room",
      "features": [
        "1 Large Bed",
        "2 small bottles of water",
        "Free WiFi"
      ],
      "capacity_guests": 2,
      "beds": 1,
      "price_foreigner_usd": 80,
      "price_resident_tzs": 80000
    },
    {
      "name": "Suit Room",
      "features": [
        "1 Large Bed",
        "Fridge",
        "Living Room",
        "Free WiFi"
      ],
      "capacity_guests": 2,
      "beds": 1,
      "price_foreigner_usd": 80,
      "price_resident_tzs": 100000
    }
  ],
  "rooms_general_notes": [
    "All rooms have a bathroom with shower, cable television, and free WiFi.",
    "Most rooms are carpeted; some have parquet flooring.",
    "Essential amenities across the property: Airport Pick-up Service, Housekeeper Services, WiFi & Internet, Laundry Services, Beach View, Free Parking Space, Restaurants and Cafes, Conference Halls.",
    "The live booking system (see booking_integration) is the authoritative source for current prices and real-time availability — these published prices should be treated as reference/fallback only, and the assistant must confirm live pricing/availability through that system rather than asserting these figures as current if the booking integration is available and returns different data."
  ],
  "restaurant": {
    "description": "ELCT Bukoba Hotel and Tours has a restaurant overlooking the Gymkhana Grounds along Lake Victoria. Offers both oriental and western meals. Lunch and dinner are served every day in a relaxed, refreshing environment. Chefs prepare a continental menu; early breakfast and afternoon snacks are also available.",
    "serves": [
      "Breakfast",
      "Brunch",
      "Lunch",
      "Dinner",
      "Dessert"
    ],
    "hours": "24 Hours (as stated on the website)",
    "other_venues": [
      {
        "name": "ELCT Vijana Cafe",
        "location": "Along Uganda Road, opposite Kagera Regional Referral Hospital and TTCL Bukoba Telephone House"
      },
      {
        "name": "ELCT Tea Room",
        "location": "At ELCT Ujirani Mwema, adjacent to the ELCT Church Bookshop, Ujirani Mwema building"
      }
    ],
    "menu": [
      {
        "name": "Something Meat",
        "price_usd": 10,
        "description": "Chicken, Meat, Tomato, Green Pepper and Herbs.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Debonair Pizza",
        "price_usd": 10,
        "description": "Fresh Tomato, Mushrooms, Onion, ND Green Chicken, Cheese and Oregano(Herbs)",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Hawaii Pizza",
        "price_usd": 10,
        "description": "Pineapple, Tomato, Sweet corn and  cheese.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Mage tee Pizza",
        "price_usd": 10,
        "description": "Cheese Tomato, Green pepper, Onion herbs and Black pepper.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Vegetable Pizza",
        "price_usd": 10,
        "description": "Cheese Tomato, Green pepper, Onion and herbs.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Egg Pizza",
        "price_usd": 10,
        "description": "Cheese, green pepper, Tomato, Onion, herbs and Egg on top.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Dry Pizza",
        "price_usd": 10,
        "description": "Beef, Carrots, Onion, Green pepper covered on Indian gravy cheese on top",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Minced meat Pizza",
        "price_usd": 10,
        "description": "Bolognaise Pizza",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Chop chop Pizza",
        "price_usd": 10,
        "description": "Cheese, Green pepper, Fresh chilly Onion and Tomato.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Parliamentary Pizza",
        "price_usd": 10,
        "description": "Mushroom, Chicken, Tomato and Herbs.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Banana Pizza",
        "price_usd": 10,
        "description": "Sausage, Tomato, Green pepper and banana on top.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Fish Pizza",
        "price_usd": 10,
        "description": "Onion, Tomato, Green pepper and Fish on top.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "MwalimuAnnamery Pizza",
        "price_usd": 10,
        "description": "Pineapple, Chicken, Green pepper, Onion, Tomato and Herbs.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Indian Pizza",
        "price_usd": 10,
        "description": "No cheese on top, Chicken, Carrots, Onion, Green pepper, Indian spices, Hot pizza and covered.",
        "menu_category": "Pizza Corner"
      },
      {
        "name": "Cream Soup",
        "price_usd": 8,
        "description": "Mushroom/ Vegetable/ Chicken/ Beef (served with bread roll)",
        "menu_category": "Soup"
      },
      {
        "name": "Hot Soup",
        "price_usd": 8,
        "description": "Chicken/ Vegetable/ Beef (served with bread roll)",
        "menu_category": "Soup"
      },
      {
        "name": "Clear Soup",
        "price_usd": 8,
        "description": "Chicken/ Vegetable/ Beef (served with bread roll)",
        "menu_category": "Soup"
      },
      {
        "name": "Beef stir fry",
        "price_usd": 12,
        "description": "Well marinated cooked  in Chinese styles sweet beef.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef Condon blue",
        "price_usd": 12,
        "description": "Well marinated, tender beef steak cheese inside ten coated with bread grams.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Paper steak",
        "price_usd": 12,
        "description": "Well marinated beef then grilled and served with paper sauces.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef Stroganoff",
        "price_usd": 12,
        "description": "Well marinated, cutting in julienne style cooked",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef curry",
        "price_usd": 12,
        "description": "Well marinated beef cut in cubie style , grilled then cooked on Indian style.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef cray",
        "price_usd": 12,
        "description": "Well marinated then cooked in Indian spices, yoghurt and hot sauces.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Roasted fried grilled beef",
        "price_usd": 12,
        "description": "Different types of cutting cooked in styles of customer.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef steak",
        "price_usd": 12,
        "description": "Well marinated beef steak tender beef, then grilled with vegatable.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Grilled beef medallion",
        "price_usd": 12,
        "description": "Well marinated beef filled then grilled topped mushroom sauces on top.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Braised beef",
        "price_usd": 12,
        "description": "Well marinated beef, cooked with little beef of oil, vegetable and some cowpeas.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Sizzling beef",
        "price_usd": 12,
        "description": "Well marinated, cutting on chef style grilled or roasted then served on hot plate.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef bolognaise",
        "price_usd": 12,
        "description": "Well marinated minced meat cooked in coconut sauces.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Beef stews",
        "price_usd": 12,
        "description": "Well marinated beef, cutting in cubie style, cooked in stick style and vegetable.",
        "menu_category": "Beef Corner"
      },
      {
        "name": "Roasted pork",
        "price_usd": 13,
        "description": "Grilled pork sort with vegetable and spinach.",
        "menu_category": "Pork Corner"
      },
      {
        "name": "Pork ribs",
        "price_usd": 13,
        "description": "Grilled pork ribs.",
        "menu_category": "Pork Corner"
      },
      {
        "name": "Pork Chop",
        "price_usd": 13,
        "description": "Grilled pork chops",
        "menu_category": "Pork Corner"
      },
      {
        "name": "Medallion pork",
        "price_usd": 13,
        "description": "Marinated pork filled sorted with vegetable and tapped with mushroom sauces.",
        "menu_category": "Pork Corner"
      },
      {
        "name": "Sour and Sweet pork",
        "price_usd": 13,
        "description": "Chinese pork (sweet pork).",
        "menu_category": "Pork Corner"
      },
      {
        "name": "Club Sandwich",
        "price_usd": 10,
        "description": "Sandwich with chicken, Eggs, Sausage, Served with French fries.",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Fillet Steak Sandwich",
        "price_usd": 10,
        "description": "Tender of chicken breast served with French fries.",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Fish Sandwich",
        "price_usd": 10,
        "description": "Fillet fish served with French fries",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Cheese Sandwich",
        "price_usd": 10,
        "description": "Slice of cheese served with French fries",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Vegetable burger",
        "price_usd": 10,
        "description": "Two play of vegetable, Tomato Mozilla Cheese and French fries",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Chicken Burger",
        "price_usd": 10,
        "description": "Two patty of chicken, Tomato, Onion, Cheese, Lettuce and French fries.",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Beef burger",
        "price_usd": 10,
        "description": "Two patty of beef, Tomato, Onion, Lettuce, Cheese and French fries.",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Double Burger",
        "price_usd": 10,
        "description": "Two patty of beef",
        "menu_category": "Burger & Sandwich"
      },
      {
        "name": "Matte Puneer",
        "price_usd": 10,
        "description": "Cottage cheese and pea curry",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Polak Puneer",
        "price_usd": 10,
        "description": "Green vegetable and coated cheese",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Dum ALDO",
        "price_usd": 10,
        "description": "Potatoes thick gravy sauces with rice",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Pannier with cashew nuts",
        "price_usd": 10,
        "description": "Cooked pannier with cashew nuts sauces.",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Vegetable Aloogaly",
        "price_usd": 10,
        "description": "Mixed vegetable cooked in tomato sauces.",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Vegetable curry",
        "price_usd": 10,
        "description": "Available vegetable cooked in Indian spice",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Vegetable Stews",
        "price_usd": 10,
        "description": "Mix vegetable",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Mushroom stews",
        "price_usd": 10,
        "description": "Mushroom gravy",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Chips Mayai",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Rosemary potatoes",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Chips Masala",
        "price_usd": 8,
        "description": "Truffle mash, pepper sauce.",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Spanish Omelet",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Plain Matoke",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "French Fries",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "Spaghetti with vegetable",
        "price_usd": 8,
        "description": "",
        "menu_category": "Vegetarian Corner"
      },
      {
        "name": "British fish fillet",
        "price_usd": 13,
        "description": "Well marinated with egg and better flour deep fried.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Chilly fish fillet",
        "price_usd": 13,
        "description": "Indian spice (Hot).",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Mushroom fish fillet",
        "price_usd": 13,
        "description": "Grilled fish fillet then lopped on mushroom sews.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Fish fillet moreureen",
        "price_usd": 13,
        "description": "Grilled fish fillet tapped on tomato sauces.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Fish fillet masala",
        "price_usd": 13,
        "description": "Indian spices.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Sweet and sour Fish fillet",
        "price_usd": 13,
        "description": "Chinese fish fried fish fillet in Chinese style then served with rice and sweet sour saws.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Fish figures",
        "price_usd": 13,
        "description": "",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Maryland fish fillet",
        "price_usd": 13,
        "description": "Well marinate and casted with bred gram.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Tilapia Arapiracho",
        "price_usd": 13,
        "description": "Grilled fillet tapped lemon and orange juice.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Tilapia Park",
        "price_usd": 13,
        "description": "Grilled fillet tapped coconut sauces.",
        "menu_category": "Fish Corner"
      },
      {
        "name": "Chicken Stews",
        "price_usd": 13,
        "description": "Well marinated, cooked in stew sauces",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken condone blue",
        "price_usd": 13,
        "description": "Tender chicken breast stuffed with cheese inside and coasted with bread gram. Then deep fried.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken archive",
        "price_usd": 13,
        "description": "Tender chicken breast stuffed with cheese inside and coasted with bread gram. Then deep fried.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Stir-fry chicken",
        "price_usd": 13,
        "description": "Sour and sweet chicken cooked in Chinese style.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken Cray",
        "price_usd": 13,
        "description": "Chicken cooked in Indian spicy.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken grave",
        "price_usd": 13,
        "description": "Chicken cooked with yoghurt and Indian spice.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken Sekela",
        "price_usd": 13,
        "description": "Chicken with bone marinated with yoghurt and Indian spice.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken curry",
        "price_usd": 13,
        "description": "Well marinated cooked in Indian spices.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Sizzling Chicken",
        "price_usd": 13,
        "description": "Chicken cutting in jollies style then served with hot plate",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken maryland",
        "price_usd": 13,
        "description": "Well marinated, coasted on  butter then coasted on bread grams.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "chicken ticker kebab",
        "price_usd": 13,
        "description": "Well marinated served on stick style.",
        "menu_category": "Chicken Corner"
      },
      {
        "name": "Chicken Makange",
        "price_usd": 13,
        "description": "Swahili style or rojorojo",
        "menu_category": "Chicken Corner"
      }
    ],
    "menu_notes": "Menu items listed are grouped into 8 categories as tabbed on the site: Pizza Corner, Soup, Beef Corner, Pork Corner, Burger & Sandwich, Vegetarian Corner, Fish Corner, Chicken Corner. All prices are quoted in USD on the site with no TZS equivalent published; if a guest asks for TZS pricing on food, say this isn't published and offer to have the hotel confirm."
  },
  "car_hire": {
    "description": "Car hire with experienced, knowledgeable drivers/guides familiar with wildlife, cultural sites, and traditional centers. Drivers are fluent in English and Swahili.",
    "use_cases": [
      "Family trip",
      "Tour trip",
      "Business trip"
    ],
    "booking_form_fields": [
      "Name",
      "Country",
      "Email",
      "Phone Number",
      "Check-in Date",
      "Check-out Date",
      "Number of People",
      "Car Hire Purpose (Tour / Journey / Other)",
      "Additional Information"
    ],
    "pricing_published": false,
    "pricing_note": "No car hire prices are published on the website — do not invent a rate; direct the guest to submit the car hire form or contact the hotel directly for a quote."
  },
  "conference": {
    "description": "Five (5) conference halls accommodating 15-500 guests depending on group size, with specialized services: PA system, LCD projectors, printing and photocopying services, free WiFi.",
    "capacity_range_guests": "15-500",
    "hall_count": 5,
    "services": [
      "PA system",
      "LCD projectors",
      "Printing services",
      "Photocopying services",
      "Free WiFi"
    ],
    "booking_form_fields": [
      "Name",
      "Country",
      "Email",
      "Phone Number",
      "Check-in Date",
      "Check-out Date",
      "Number of People",
      "Hall Purpose (Wedding / Conference / Party / Other)",
      "Additional Information"
    ],
    "pricing_published": false,
    "pricing_note": "No conference hall prices are published on the website — do not invent a rate; direct the guest to submit the hall booking form or contact the hotel directly for a quote."
  },
  "tour": {
    "description": "Wildlife tours, photographic tours, geographic tours, archaeological tours, cultural tours, walking tours, and fishing on Lake Victoria. Transport to attractions including Kyamunene Water Fall, Burigi National Park, Chato National Park, and Serengeti National Park. Drivers are experienced and fluent in English and Swahili.",
    "destinations_mentioned": [
      "Kyamunene Water Fall",
      "Burigi National Park",
      "Chato National Park",
      "Serengeti National Park"
    ],
    "booking_form_fields": [
      "Name",
      "Country",
      "Email",
      "Phone Number",
      "Check-in Date",
      "Check-out Date",
      "Number of People",
      "Tour place",
      "Additional Information"
    ],
    "pricing_published": false,
    "pricing_note": "No tour prices are published on the website — do not invent a rate; direct the guest to submit the tour booking form or contact the hotel directly for a quote."
  },
  "extra_services": [
    {
      "name": "Laundry Services",
      "description": "Washing, drying and ironing; delicate items and bulk laundry handled.",
      "pricing": [
        {
          "item": "Shirt, trouser, socks or underwear",
          "price_usd": 1
        },
        {
          "item": "Pair of shoes",
          "price_usd": 3
        },
        {
          "item": "Suit",
          "price_usd": 7
        }
      ]
    },
    {
      "name": "Garden Photo Services",
      "description": "Green, attractive hotel garden used for wedding ceremonies, birthday parties, kitchen parties, partner engagements and other events.",
      "pricing": [
        {
          "item": "Photo package (30 minutes)",
          "price_usd": 20
        },
        {
          "item": "Video package (30 minutes)",
          "price_usd": 30
        }
      ]
    },
    {
      "name": "Money Transaction Services",
      "description": "Secure, reliable way to send or receive money and perform other financial transactions, located at the front desk.",
      "hours": "24 hours"
    },
    {
      "name": "Books & Stationery",
      "description": "Complimentary stationery essentials — pens, notepad, greeting cards — plus printing services."
    },
    {
      "name": "Curio Shops",
      "description": "Souvenirs and local treasures — authentic crafts, artwork and gifts reflecting local culture and tradition."
    },
    {
      "name": "Airport Pickup",
      "description": "Professional drivers greet guests on arrival and transport them to the hotel.",
      "pricing_note": "Airport pickup pricing is set per-location in the live booking system (per-person rate, may exclude children) — use the booking_integration for a current figure rather than quoting a fixed number."
    }
  ],
  "booking_integration": {
    "status": "External system exists but is treated as an integration point, not a directly-called API by this assistant at this stage.",
    "known_system": "A separate booking application exists at a hotel-operated subdomain (distinct from the WordPress marketing site), covering all three locations (Bukoba Main, Annex, Chato), with room types, resident/foreigner rates, VAT-inclusive pricing, and an airport-pickup pricing setting per location.",
    "assistant_behavior": "The assistant must NOT claim to check or confirm real-time availability itself. For booking requests, it should: (1) collect the guest's intent (dates, room type, guests, location) conversationally, (2) present the published reference prices from this knowledge base with a caveat that final pricing/availability is confirmed by the hotel, and (3) direct the guest to the official Book a Room page or hotel contact channels to complete a real booking. This satisfies the 'never claim availability without checking the real system' rule without pretending an unconfirmed URL is a stable API."
  },
  "policies": {
    "pricing": "Room and food prices published on the site are treated as reference figures. The live booking system indicates room rates are VAT-inclusive (VAT is shown broken out of the total, not added on top). No separate published cancellation, check-in/check-out time, or refund policy exists on the pages reviewed — do not invent one; tell the guest to confirm with the hotel directly.",
    "payment": "The Book a Room flow states: 'Pay at Hotel' (payment is made at the hotel, not online) and offers '24hr Confirmation'.",
    "residency_pricing": "The hotel distinguishes 'Resident' (Tanzanian) and 'Foreigner' pricing; nationality determines which rate applies."
  },
  "destination_knowledge": {
    "region": "Kagera Region, northwest Tanzania, on the western shore of Lake Victoria",
    "note": "Geographic/destination information (Bukoba, Kagera, Tanzania, airports, roads, landmarks) may be used to help guests reach or understand the hotel, but must never be used to recommend competing hotels, lodges, restaurants, or hospitality businesses. See competitor_policy."
  },
  "competitor_policy": {
    "rule": "The assistant must never recommend, promote, rank, compare favorably, or direct guests toward competing hotels, lodges, guesthouses, resorts, restaurants, bars, or other hospitality businesses — even if explicitly asked (e.g. 'best restaurants in Bukoba', 'other hotels nearby'). It must redirect to ELCT Bukoba Hotel & Tours' own restaurant, dining, and accommodation services instead, while still answering legitimate geographic/logistics questions (e.g. how to get to the hotel from another city) using destination_knowledge.",
    "enforced_at": [
      "system prompt",
      "RAG knowledge boundaries (this file contains no competitor data by design)",
      "application/business logic layer",
      "output validation"
    ]
  }
};
