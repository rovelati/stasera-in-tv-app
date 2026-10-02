import { ChannelSchedule, Channel, Program } from '../types';

export const fallbackChannels: Channel[] = [
  { id: 'rai-1', name: 'Rai 1', number: 1, logo: 'rai-1.svg', stream: { url: 'https://www.raiplay.it/dirette/rai1', label: 'RaiPlay' } },
  { id: 'rai-2', name: 'Rai 2', number: 2, logo: 'rai-2.svg', stream: { url: 'https://www.raiplay.it/dirette/rai2', label: 'RaiPlay' } },
  { id: 'rai-3', name: 'Rai 3', number: 3, logo: 'rai-3.svg', stream: { url: 'https://www.raiplay.it/dirette/rai3', label: 'RaiPlay' } },
  { id: 'rete-4', name: 'Rete 4', number: 4, logo: 'rete-4.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/rete4_cR4', label: 'Mediaset Infinity' } },
  { id: 'canale-5', name: 'Canale 5', number: 5, logo: 'canale-5.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/canale5_cC5', label: 'Mediaset Infinity' } },
  { id: 'italia-1', name: 'Italia 1', number: 6, logo: 'italia-1.png', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/italia1_cI1', label: 'Mediaset Infinity' } },
  { id: 'la7', name: 'La7', number: 7, logo: 'la7.png', stream: { url: 'https://www.la7.it/dirette-tv', label: 'La7' } },
  { id: 'tv8', name: 'TV8', number: 8, logo: 'tv8.png', stream: { url: 'https://tv8.it/streaming', label: 'TV8' } },
  { id: 'nove', name: 'Nove', number: 9, logo: 'nove.png', stream: { url: 'https://discoveryplus.com/it/channel/nove', label: 'Discovery+' } },
  { id: '20', name: '20 Mediaset', number: 20, logo: '20.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/20_cVE', label: 'Mediaset Infinity' } },
  { id: 'rai-4', name: 'Rai 4', number: 21, logo: 'rai-4.svg', stream: { url: 'https://www.raiplay.it/dirette/rai4', label: 'RaiPlay' } },
  { id: 'iris', name: 'Iris', number: 22, logo: 'iris.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/iris_cKI', label: 'Mediaset Infinity' } },
  { id: 'rai-5', name: 'Rai 5', number: 23, logo: 'rai-5.svg', stream: { url: 'https://www.raiplay.it/dirette/rai5', label: 'RaiPlay' } },
  { id: 'rai-movie', name: 'Rai Movie', number: 24, logo: 'rai-movie.svg', stream: { url: 'https://www.raiplay.it/dirette/raimovie', label: 'RaiPlay' } },
  { id: 'rai-premium', name: 'Rai Premium', number: 25, logo: 'rai-premium.svg', stream: { url: 'https://www.raiplay.it/dirette/raipremium', label: 'RaiPlay' } },
  { id: 'twentyseven', name: 'Twenty Seven', number: 27, logo: 'twentyseven.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/twentyseven_cTS', label: 'Mediaset Infinity' } },
  { id: 'tv2000', name: 'TV2000', number: 28, logo: 'tv2000.png', stream: { url: 'https://www.tv2000.it/live', label: 'TV2000' } },
  { id: 'la7d', name: 'La7d', number: 29, logo: 'la7d.svg', stream: { url: 'https://www.la7.it/dirette-tv', label: 'La7' } },
  { id: 'la5', name: 'La5', number: 30, logo: 'la5.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/la5_cKA', label: 'Mediaset Infinity' } },
  { id: 'real-time', name: 'Real Time', number: 31, logo: 'real-time.png', stream: { url: 'https://discoveryplus.com/it/channel/real-time', label: 'Discovery+' } },
  { id: 'food-network', name: 'Food Network', number: 33, logo: 'food-network.png', stream: { url: 'https://discoveryplus.com/it/channel/food-network', label: 'Discovery+' } },
  { id: 'cine34', name: 'Cine34', number: 34, logo: 'cine34.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/cine34_cB6', label: 'Mediaset Infinity' } },
  { id: 'focus', name: 'Focus', number: 35, logo: 'focus.svg', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/focus_cFU', label: 'Mediaset Infinity' } },
  { id: 'giallo', name: 'Giallo', number: 38, logo: 'giallo.png', stream: { url: 'https://discoveryplus.com/it/channel/giallo', label: 'Discovery+' } },
  { id: 'top-crime', name: 'Top Crime', number: 39, logo: 'top-crime.png', stream: { url: 'https://mediasetinfinity.mediaset.it/diretta/topcrime_cLT', label: 'Mediaset Infinity' } },
  { id: 'dmax', name: 'DMAX', number: 52, logo: 'dmax.png', stream: { url: 'https://discoveryplus.com/it/channel/dmax', label: 'Discovery+' } },
];

export const fallbackStaseraSchedule: ChannelSchedule[] = [
  {
    channel: fallbackChannels[0], // Rai 1
    programs: [
      {
        id: '101',
        title: 'UEFA Nations League',
        description: 'La grande sfida internazionale di calcio con telecronaca in diretta.',
        category: 'Sport',
        startTime: '2026-10-02T18:30:00.000Z',
        endTime: '2026-10-02T21:30:00.000Z',
        startTimeFormatted: '20:30',
        endTimeFormatted: '23:30',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/6/7/2/769276/originale/769276.jpg',
        isPrimaSerata: true,
      },
      {
        id: '102',
        title: 'TG1 Sera',
        description: 'Il notiziario della prima rete con tutti gli aggiornamenti dall\'Italia e dal mondo.',
        category: 'Informazione',
        startTime: '2026-10-02T21:30:00.000Z',
        endTime: '2026-10-02T21:45:00.000Z',
        startTimeFormatted: '23:30',
        endTimeFormatted: '23:45',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/616966.jpg',
        isPrimaSerata: false,
        isSecondaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[1], // Rai 2
    programs: [
      {
        id: '103',
        title: "L'Ispettore Coliandro - Il ritorno",
        description: 'Un poliziotto anomalo e pasticcione, alle prese con crimini nella Bologna sotterranea.',
        category: 'Serie TV',
        startTime: '2026-10-02T19:20:00.000Z',
        endTime: '2026-10-02T21:10:00.000Z',
        startTimeFormatted: '21:20',
        endTimeFormatted: '23:10',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/7/7/2/769277/originale/769277.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[2], // Rai 3
    programs: [
      {
        id: '104',
        title: 'Exodus',
        description: 'Un kolossal drammatico ed epico diretto da Ridley Scott con Christian Bale.',
        category: 'Film',
        startTime: '2026-10-02T19:20:00.000Z',
        endTime: '2026-10-02T21:45:00.000Z',
        startTimeFormatted: '21:20',
        endTimeFormatted: '23:45',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/7/2/769274/originale/769274.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[3], // Rete 4
    programs: [
      {
        id: '201',
        title: 'Quarto Grado',
        description: 'Approfondimento giornalistico sui casi di cronaca nera e giudiziaria condotto da Gianluigi Nuzzi.',
        category: 'Informazione',
        startTime: '2026-10-02T19:30:00.000Z',
        endTime: '2026-10-02T22:30:00.000Z',
        startTimeFormatted: '21:30',
        endTimeFormatted: '00:30',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/662740.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[4], // Canale 5
    programs: [
      {
        id: '202',
        title: 'Grande Fratello - Vip',
        description: 'Il celebre reality show con le vicende dei concorrenti nella casa più spiata d\'Italia.',
        category: 'Intrattenimento',
        startTime: '2026-10-02T19:20:00.000Z',
        endTime: '2026-10-02T23:30:00.000Z',
        startTimeFormatted: '21:20',
        endTimeFormatted: '01:30',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/8/2/769280/originale/769280.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[5], // Italia 1
    programs: [
      {
        id: '301',
        title: 'Shooter',
        description: 'Film d\'azione con Mark Wahlberg. Un tiratore scelto viene incastrato per un attentato presidenziale.',
        category: 'Film',
        startTime: '2026-10-02T19:20:00.000Z',
        endTime: '2026-10-02T21:45:00.000Z',
        startTimeFormatted: '21:20',
        endTimeFormatted: '23:45',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/3/7/730/originale/103102.jpg',
        isPrimaSerata: true,
      },
      {
        id: '302',
        title: 'Lone Survivor',
        description: 'Film di guerra con Mark Wahlberg. La missione di quattro Navy SEALs in territorio talebano.',
        category: 'Film',
        startTime: '2026-10-02T21:45:00.000Z',
        endTime: '2026-10-02T23:45:00.000Z',
        startTimeFormatted: '23:45',
        endTimeFormatted: '01:45',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/3/0/203033/originale/44443.jpg',
        isPrimaSerata: false,
        isSecondaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[6], // La7
    programs: [
      {
        id: '401',
        title: 'Propaganda Live',
        description: 'Satira politica, inchieste e musica dal vivo condotto da Diego Bianchi (Zoro).',
        category: 'Intrattenimento',
        startTime: '2026-10-02T19:15:00.000Z',
        endTime: '2026-10-02T23:30:00.000Z',
        startTimeFormatted: '21:15',
        endTimeFormatted: '01:30',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/3/2/759233/originale/759233.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[7], // TV8
    programs: [
      {
        id: '501',
        title: 'Pechino Express',
        description: 'L\'avventura on the road tra culture e sfide mozzafiato condotta da Costantino della Gherardesca.',
        category: 'Intrattenimento',
        startTime: '2026-10-02T19:40:00.000Z',
        endTime: '2026-10-02T22:30:00.000Z',
        startTimeFormatted: '21:40',
        endTimeFormatted: '00:30',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/4/4/757445/originale/757445.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[8], // Nove
    programs: [
      {
        id: '601',
        title: 'Fratelli di Crozza',
        description: 'La satira e le imitazioni uniche di Maurizio Crozza sui fatti e i personaggi della settimana.',
        category: 'Intrattenimento',
        startTime: '2026-10-02T19:30:00.000Z',
        endTime: '2026-10-02T21:15:00.000Z',
        startTimeFormatted: '21:30',
        endTimeFormatted: '23:15',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/5/7/2/769275/originale/769275.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[9], // 20
    programs: [
      {
        id: '701',
        title: 'Kong: Skull Island',
        description: 'Film d\'avventura e azione. Una spedizione esplora un\'isola misteriosa nel Pacifico.',
        category: 'Film',
        startTime: '2026-10-02T19:10:00.000Z',
        endTime: '2026-10-02T21:10:00.000Z',
        startTimeFormatted: '21:10',
        endTimeFormatted: '23:10',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/3/4/8/140843/originale/72816.jpg',
        isPrimaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[10], // Rai 4
    programs: [
      {
        id: '801',
        title: 'Fuga nella giungla',
        description: 'Film thriller e d\'azione ad alta tensione ambientato nella foresta tropicale.',
        category: 'Film',
        startTime: '2026-10-02T19:20:00.000Z',
        endTime: '2026-10-02T21:05:00.000Z',
        startTimeFormatted: '21:20',
        endTimeFormatted: '23:05',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/0/0/originale/332554.jpg',
        isPrimaSerata: true,
      },
      {
        id: '802',
        title: 'Farang',
        description: 'Film d\'azione e vendetta con un ex detenuto costretto a fuggire in Thailandia.',
        category: 'Film',
        startTime: '2026-10-02T21:05:00.000Z',
        endTime: '2026-10-02T22:45:00.000Z',
        startTimeFormatted: '23:05',
        endTimeFormatted: '00:45',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/4/0/8/745804/originale/745804.jpg',
        isPrimaSerata: false,
        isSecondaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[11], // Iris
    programs: [
      {
        id: '901',
        title: "Una 44 Magnum per l'ispettore Callaghan",
        description: 'Capolavoro del cinema poliziesco con Clint Eastwood nei panni del duro ispettore Harry.',
        category: 'Film',
        startTime: '2026-10-02T19:15:00.000Z',
        endTime: '2026-10-02T21:40:00.000Z',
        startTimeFormatted: '21:15',
        endTimeFormatted: '23:40',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/1/7/2/37271/originale/112540.jpg',
        isPrimaSerata: true,
      },
      {
        id: '902',
        title: 'La recluta',
        description: 'Poliziesco d\'azione diretto e interpretato da Clint Eastwood con Charlie Sheen.',
        category: 'Film',
        startTime: '2026-10-02T21:40:00.000Z',
        endTime: '2026-10-02T23:55:00.000Z',
        startTimeFormatted: '23:40',
        endTimeFormatted: '01:55',
        posterUrl: 'https://www.sorrisi.com/guidatv/uploads/media/cache/epg_program_small/uploads/epg/images/program/9/3/8/97839/originale/55249.jpg',
        isPrimaSerata: false,
        isSecondaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[13], // Rai Movie
    programs: [
      {
        id: '1001',
        title: 'Ammore e malavita',
        description: 'Film musicale e commedia dei Manetti Bros vincitore di 5 David di Donatello.',
        category: 'Film',
        startTime: '2026-10-02T19:10:00.000Z',
        endTime: '2026-10-02T21:20:00.000Z',
        startTimeFormatted: '21:10',
        endTimeFormatted: '23:20',
        posterUrl: 'https://image.tmdb.org/t/p/w500/y6P0b6vP3N3WvE6kOwhqIeD1y2l.jpg',
        isPrimaSerata: true,
      },
      {
        id: '1002',
        title: 'Chef',
        description: 'Commedia brillante di e con Jon Favreau con Sofia Vergara e Scarlett Johansson.',
        category: 'Film',
        startTime: '2026-10-02T21:20:00.000Z',
        endTime: '2026-10-02T23:20:00.000Z',
        startTimeFormatted: '23:20',
        endTimeFormatted: '01:20',
        posterUrl: 'https://image.tmdb.org/t/p/w500/dK3vB4X5p6d2y1w8xJz3Z0u9yB1.jpg',
        isPrimaSerata: false,
        isSecondaSerata: true,
      },
    ],
  },
  {
    channel: fallbackChannels[21], // Cine34
    programs: [
      {
        id: '1101',
        title: 'La guerra dei nonni',
        description: 'Commedia italiana con Vincenzo Salemme e Max Tortora diretta da Gianluca Ansanelli.',
        category: 'Film',
        startTime: '2026-10-02T19:00:00.000Z',
        endTime: '2026-10-02T21:00:00.000Z',
        startTimeFormatted: '21:00',
        endTimeFormatted: '23:00',
        posterUrl: 'https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg',
        isPrimaSerata: true,
      },
    ],
  },
];
