import { getWcTeams } from '../lib/flags'
import type { FormationCode, PlayerRole } from '../lib/formations'

export interface SquadPlayer {
  name: string
  number: number
  role: PlayerRole
}

export interface TeamSquad {
  team: string
  formation: FormationCode
  players: SquadPlayer[]
  bench: SquadPlayer[]
}

type RawPlayer = { name: string; number: number; role: PlayerRole }

/** Expected key players per nation (illustrative squads for the tournament hub). */
const SQUAD_DATA: Record<string, { formation: FormationCode; players: RawPlayer[]; bench?: RawPlayer[] }> = {
  Argentina: {
    formation: '4-3-3',
    players: [
      { name: 'Emiliano Martínez', number: 1, role: 'GK' },
      { name: 'Nahuel Molina', number: 26, role: 'DEF' },
      { name: 'Cristian Romero', number: 13, role: 'DEF' },
      { name: 'Nicolás Otamendi', number: 19, role: 'DEF' },
      { name: 'Marcos Acuña', number: 8, role: 'DEF' },
      { name: 'Enzo Fernández', number: 24, role: 'MID' },
      { name: 'Rodrigo De Paul', number: 7, role: 'MID' },
      { name: 'Alexis Mac Allister', number: 20, role: 'MID' },
      { name: 'Lionel Messi', number: 10, role: 'FWD' },
      { name: 'Lautaro Martínez', number: 22, role: 'FWD' },
      { name: 'Julián Álvarez', number: 9, role: 'FWD' },
    ],
    bench: [
      { name: 'Gerónimo Rulli', number: 12, role: 'GK' },
      { name: 'Leandro Paredes', number: 5, role: 'MID' },
    ],
  },
  Brazil: {
    formation: '4-3-3',
    players: [
      { name: 'Alisson', number: 1, role: 'GK' },
      { name: 'Danilo', number: 2, role: 'DEF' },
      { name: 'Marquinhos', number: 4, role: 'DEF' },
      { name: 'Gabriel Magalhães', number: 3, role: 'DEF' },
      { name: 'Wendell', number: 6, role: 'DEF' },
      { name: 'Casemiro', number: 5, role: 'MID' },
      { name: 'Bruno Guimarães', number: 8, role: 'MID' },
      { name: 'Paquetá', number: 10, role: 'MID' },
      { name: 'Vinícius Júnior', number: 7, role: 'FWD' },
      { name: 'Richarlison', number: 9, role: 'FWD' },
      { name: 'Rodrygo', number: 11, role: 'FWD' },
    ],
  },
  France: {
    formation: '4-3-3',
    players: [
      { name: 'Mike Maignan', number: 1, role: 'GK' },
      { name: 'Jules Koundé', number: 5, role: 'DEF' },
      { name: 'William Saliba', number: 4, role: 'DEF' },
      { name: 'Dayot Upamecano', number: 2, role: 'DEF' },
      { name: 'Théo Hernandez', number: 22, role: 'DEF' },
      { name: 'Aurélien Tchouaméni', number: 8, role: 'MID' },
      { name: 'Eduardo Camavinga', number: 6, role: 'MID' },
      { name: 'Adrien Rabiot', number: 14, role: 'MID' },
      { name: 'Kylian Mbappé', number: 10, role: 'FWD' },
      { name: 'Ousmane Dembélé', number: 11, role: 'FWD' },
      { name: 'Antoine Griezmann', number: 7, role: 'FWD' },
    ],
  },
  England: {
    formation: '4-3-3',
    players: [
      { name: 'Jordan Pickford', number: 1, role: 'GK' },
      { name: 'Kyle Walker', number: 2, role: 'DEF' },
      { name: 'John Stones', number: 5, role: 'DEF' },
      { name: 'Marc Guéhi', number: 6, role: 'DEF' },
      { name: 'Luke Shaw', number: 3, role: 'DEF' },
      { name: 'Declan Rice', number: 4, role: 'MID' },
      { name: 'Jude Bellingham', number: 10, role: 'MID' },
      { name: 'Phil Foden', number: 11, role: 'MID' },
      { name: 'Bukayo Saka', number: 7, role: 'FWD' },
      { name: 'Harry Kane', number: 9, role: 'FWD' },
      { name: 'Ollie Watkins', number: 19, role: 'FWD' },
    ],
  },
  Germany: {
    formation: '4-2-3-1',
    players: [
      { name: 'Manuel Neuer', number: 1, role: 'GK' },
      { name: 'Joshua Kimmich', number: 6, role: 'DEF' },
      { name: 'Antonio Rüdiger', number: 2, role: 'DEF' },
      { name: 'Jonathan Tah', number: 4, role: 'DEF' },
      { name: 'David Raum', number: 3, role: 'DEF' },
      { name: 'Robert Andrich', number: 23, role: 'MID' },
      { name: 'Jamal Musiala', number: 10, role: 'MID' },
      { name: 'Florian Wirtz', number: 17, role: 'MID' },
      { name: 'Leroy Sané', number: 19, role: 'FWD' },
      { name: 'Kai Havertz', number: 7, role: 'FWD' },
      { name: 'Niclas Füllkrug', number: 9, role: 'FWD' },
    ],
  },
  Spain: {
    formation: '4-3-3',
    players: [
      { name: 'Unai Simón', number: 1, role: 'GK' },
      { name: 'Dani Carvajal', number: 2, role: 'DEF' },
      { name: 'Aymeric Laporte', number: 14, role: 'DEF' },
      { name: 'Robin Le Normand', number: 3, role: 'DEF' },
      { name: 'Marc Cucurella', number: 22, role: 'DEF' },
      { name: 'Rodri', number: 16, role: 'MID' },
      { name: 'Pedri', number: 8, role: 'MID' },
      { name: 'Gavi', number: 9, role: 'MID' },
      { name: 'Lamine Yamal', number: 19, role: 'FWD' },
      { name: 'Álvaro Morata', number: 7, role: 'FWD' },
      { name: 'Nico Williams', number: 17, role: 'FWD' },
    ],
  },
  Portugal: {
    formation: '4-3-3',
    players: [
      { name: 'Diogo Costa', number: 1, role: 'GK' },
      { name: 'João Cancelo', number: 20, role: 'DEF' },
      { name: 'Rúben Dias', number: 4, role: 'DEF' },
      { name: 'Pepe', number: 3, role: 'DEF' },
      { name: 'Nuno Mendes', number: 19, role: 'DEF' },
      { name: 'Bruno Fernandes', number: 8, role: 'MID' },
      { name: 'Bernardo Silva', number: 10, role: 'MID' },
      { name: 'Vitinha', number: 23, role: 'MID' },
      { name: 'Cristiano Ronaldo', number: 7, role: 'FWD' },
      { name: 'Rafael Leão', number: 17, role: 'FWD' },
      { name: 'Diogo Jota', number: 21, role: 'FWD' },
    ],
  },
  Netherlands: {
    formation: '4-3-3',
    players: [
      { name: 'Virgil van Dijk', number: 4, role: 'DEF' },
      { name: 'Nathan Aké', number: 5, role: 'DEF' },
      { name: 'Denzel Dumfries', number: 22, role: 'DEF' },
      { name: 'Jeremie Frimpong', number: 12, role: 'DEF' },
      { name: 'Bart Verbruggen', number: 1, role: 'GK' },
      { name: 'Frenkie de Jong', number: 21, role: 'MID' },
      { name: 'Tijjani Reijnders', number: 14, role: 'MID' },
      { name: 'Xavi Simons', number: 7, role: 'MID' },
      { name: 'Memphis Depay', number: 10, role: 'FWD' },
      { name: 'Cody Gakpo', number: 11, role: 'FWD' },
      { name: 'Brian Brobbey', number: 9, role: 'FWD' },
    ],
  },
  Belgium: {
    formation: '4-3-3',
    players: [
      { name: 'Koen Casteels', number: 1, role: 'GK' },
      { name: 'Timothy Castagne', number: 21, role: 'DEF' },
      { name: 'Wout Faes', number: 4, role: 'DEF' },
      { name: 'Arthur Theate', number: 3, role: 'DEF' },
      { name: 'Zeno Debast', number: 2, role: 'DEF' },
      { name: 'Kevin De Bruyne', number: 7, role: 'MID' },
      { name: 'Youri Tielemans', number: 8, role: 'MID' },
      { name: 'Amadou Onana', number: 24, role: 'MID' },
      { name: 'Romelu Lukaku', number: 9, role: 'FWD' },
      { name: 'Jérémy Doku', number: 11, role: 'FWD' },
      { name: 'Loïs Openda', number: 20, role: 'FWD' },
    ],
  },
  USA: {
    formation: '4-3-3',
    players: [
      { name: 'Matt Turner', number: 1, role: 'GK' },
      { name: 'Sergiño Dest', number: 2, role: 'DEF' },
      { name: 'Chris Richards', number: 3, role: 'DEF' },
      { name: 'Tim Ream', number: 13, role: 'DEF' },
      { name: 'Antonee Robinson', number: 5, role: 'DEF' },
      { name: 'Yunus Musah', number: 6, role: 'MID' },
      { name: 'Weston McKennie', number: 8, role: 'MID' },
      { name: 'Tyler Adams', number: 4, role: 'MID' },
      { name: 'Christian Pulisic', number: 10, role: 'FWD' },
      { name: 'Folarin Balogun', number: 9, role: 'FWD' },
      { name: 'Giovanni Reyna', number: 7, role: 'FWD' },
    ],
  },
  Mexico: {
    formation: '4-4-2',
    players: [
      { name: 'Guillermo Ochoa', number: 13, role: 'GK' },
      { name: 'Jorge Sánchez', number: 2, role: 'DEF' },
      { name: 'César Montes', number: 3, role: 'DEF' },
      { name: 'Johan Vásquez', number: 5, role: 'DEF' },
      { name: 'Gerardo Arteaga', number: 4, role: 'DEF' },
      { name: 'Edson Álvarez', number: 6, role: 'MID' },
      { name: 'Luis Chávez', number: 24, role: 'MID' },
      { name: 'Orbelín Pineda', number: 17, role: 'MID' },
      { name: 'Hirving Lozano', number: 22, role: 'MID' },
      { name: 'Santiago Giménez', number: 11, role: 'FWD' },
      { name: 'Raúl Jiménez', number: 9, role: 'FWD' },
    ],
  },
  Croatia: {
    formation: '4-3-3',
    players: [
      { name: 'Dominik Livaković', number: 1, role: 'GK' },
      { name: 'Josip Šutalo', number: 4, role: 'DEF' },
      { name: 'Joško Gvardiol', number: 20, role: 'DEF' },
      { name: 'Borna Sosa', number: 3, role: 'DEF' },
      { name: 'Josip Juranović', number: 22, role: 'DEF' },
      { name: 'Luka Modrić', number: 10, role: 'MID' },
      { name: 'Mateo Kovačić', number: 8, role: 'MID' },
      { name: 'Marcelo Brozović', number: 11, role: 'MID' },
      { name: 'Bruno Petković', number: 9, role: 'FWD' },
      { name: 'Marko Livaja', number: 14, role: 'FWD' },
      { name: 'Ivan Perišić', number: 4, role: 'FWD' },
    ],
  },
  Morocco: {
    formation: '4-3-3',
    players: [
      { name: 'Bono', number: 1, role: 'GK' },
      { name: 'Achraf Hakimi', number: 2, role: 'DEF' },
      { name: 'Nayef Aguerd', number: 5, role: 'DEF' },
      { name: 'Romain Saïss', number: 6, role: 'DEF' },
      { name: 'Noussair Mazraoui', number: 3, role: 'DEF' },
      { name: 'Sofyan Amrabat', number: 4, role: 'MID' },
      { name: 'Azzedine Ounahi', number: 8, role: 'MID' },
      { name: 'Bilal El Khannouss', number: 10, role: 'MID' },
      { name: 'Hakim Ziyech', number: 7, role: 'FWD' },
      { name: 'Youssef En-Nesyri', number: 19, role: 'FWD' },
      { name: 'Brahim Díaz', number: 11, role: 'FWD' },
    ],
  },
  Japan: {
    formation: '4-2-3-1',
    players: [
      { name: 'Takefusa Kubo', number: 10, role: 'FWD' },
      { name: 'Kaoru Mitoma', number: 7, role: 'FWD' },
      { name: 'Daizen Maeda', number: 9, role: 'FWD' },
      { name: 'Wataru Endō', number: 6, role: 'MID' },
      { name: 'Hidemasa Morita', number: 8, role: 'MID' },
      { name: 'Ritsu Doan', number: 11, role: 'MID' },
      { name: 'Hiroki Itō', number: 3, role: 'DEF' },
      { name: 'Ko Itakura', number: 4, role: 'DEF' },
      { name: 'Yukinari Sugawara', number: 2, role: 'DEF' },
      { name: 'Takehiro Tomiyasu', number: 5, role: 'DEF' },
      { name: 'Gonda', number: 1, role: 'GK' },
    ],
  },
  'South Korea': {
    formation: '4-4-2',
    players: [
      { name: 'Kim Seung-gyu', number: 1, role: 'GK' },
      { name: 'Kim Min-jae', number: 4, role: 'DEF' },
      { name: 'Kim Young-gwon', number: 19, role: 'DEF' },
      { name: 'Kim Jin-su', number: 3, role: 'DEF' },
      { name: 'Kim Tae-hwan', number: 2, role: 'DEF' },
      { name: 'Lee Kang-in', number: 18, role: 'MID' },
      { name: 'Hwang Hee-chan', number: 11, role: 'MID' },
      { name: 'Jung Woo-young', number: 5, role: 'MID' },
      { name: 'Son Heung-min', number: 7, role: 'MID' },
      { name: 'Cho Gue-sung', number: 9, role: 'FWD' },
      { name: 'Oh Hyeon-gyu', number: 10, role: 'FWD' },
    ],
  },
  Uruguay: {
    formation: '4-4-2',
    players: [
      { name: 'Sergio Rochet', number: 1, role: 'GK' },
      { name: 'Ronald Araújo', number: 4, role: 'DEF' },
      { name: 'José Giménez', number: 2, role: 'DEF' },
      { name: 'Matías Viña', number: 17, role: 'DEF' },
      { name: 'Guillermo Varela', number: 13, role: 'DEF' },
      { name: 'Federico Valverde', number: 15, role: 'MID' },
      { name: 'Rodrigo Bentancur', number: 6, role: 'MID' },
      { name: 'Manuel Ugarte', number: 5, role: 'MID' },
      { name: 'Giorgian de Arrascaeta', number: 10, role: 'MID' },
      { name: 'Darwin Núñez', number: 9, role: 'FWD' },
      { name: 'Luis Suárez', number: 7, role: 'FWD' },
    ],
  },
  Colombia: {
    formation: '4-3-3',
    players: [
      { name: 'Camilo Vargas', number: 12, role: 'GK' },
      { name: 'Santiago Arias', number: 4, role: 'DEF' },
      { name: 'Davinson Sánchez', number: 3, role: 'DEF' },
      { name: 'Yerry Mina', number: 13, role: 'DEF' },
      { name: 'Johan Mojica', number: 17, role: 'DEF' },
      { name: 'Jefferson Lerma', number: 16, role: 'MID' },
      { name: 'Jhon Arias', number: 21, role: 'MID' },
      { name: 'James Rodríguez', number: 10, role: 'MID' },
      { name: 'Luis Díaz', number: 7, role: 'FWD' },
      { name: 'Rafael Borré', number: 9, role: 'FWD' },
      { name: 'Jhon Durán', number: 19, role: 'FWD' },
    ],
  },
  Switzerland: {
    formation: '4-4-2',
    players: [
      { name: 'Yann Sommer', number: 1, role: 'GK' },
      { name: 'Manuel Akanji', number: 5, role: 'DEF' },
      { name: 'Nico Elvedi', number: 4, role: 'DEF' },
      { name: 'Ricardo Rodríguez', number: 13, role: 'DEF' },
      { name: 'Silvan Widmer', number: 2, role: 'DEF' },
      { name: 'Granit Xhaka', number: 10, role: 'MID' },
      { name: 'Remo Freuler', number: 8, role: 'MID' },
      { name: 'Ruben Vargas', number: 17, role: 'MID' },
      { name: 'Xherdan Shaqiri', number: 23, role: 'MID' },
      { name: 'Breel Embolo', number: 7, role: 'FWD' },
      { name: 'Dan Ndoye', number: 11, role: 'FWD' },
    ],
  },
  Senegal: {
    formation: '4-3-3',
    players: [
      { name: 'Édouard Mendy', number: 1, role: 'GK' },
      { name: 'Kalidou Koulibaly', number: 3, role: 'DEF' },
      { name: 'Abdou Diallo', number: 4, role: 'DEF' },
      { name: 'Ismaila Jakobs', number: 14, role: 'DEF' },
      { name: 'Youssouf Sabaly', number: 21, role: 'DEF' },
      { name: 'Idrissa Gueye', number: 5, role: 'MID' },
      { name: 'Pape Matar Sarr', number: 17, role: 'MID' },
      { name: 'Sadio Mané', number: 10, role: 'MID' },
      { name: 'Nicolas Jackson', number: 9, role: 'FWD' },
      { name: 'Boulaye Dia', number: 19, role: 'FWD' },
      { name: 'Iliman Ndiaye', number: 11, role: 'FWD' },
    ],
  },
  Australia: {
    formation: '4-4-2',
    players: [
      { name: 'Mathew Ryan', number: 1, role: 'GK' },
      { name: 'Fran Karačić', number: 2, role: 'DEF' },
      { name: 'Harry Souttar', number: 19, role: 'DEF' },
      { name: 'Bailey Wright', number: 4, role: 'DEF' },
      { name: 'Aziz Behich', number: 16, role: 'DEF' },
      { name: 'Jackson Irvine', number: 19, role: 'MID' },
      { name: 'Riley McGree', number: 17, role: 'MID' },
      { name: 'Craig Goodwin', number: 23, role: 'MID' },
      { name: 'Martin Boyle', number: 6, role: 'MID' },
      { name: 'Mitchell Duke', number: 9, role: 'FWD' },
      { name: 'Garang Kuol', number: 11, role: 'FWD' },
    ],
  },
  Canada: {
    formation: '4-4-2',
    players: [
      { name: 'Milan Borjan', number: 1, role: 'GK' },
      { name: 'Alphonso Davies', number: 19, role: 'DEF' },
      { name: 'Steven Vitória', number: 5, role: 'DEF' },
      { name: 'Derek Cornelius', number: 4, role: 'DEF' },
      { name: 'Sam Adekugbe', number: 3, role: 'DEF' },
      { name: 'Stephen Eustáquio', number: 7, role: 'MID' },
      { name: 'Atiba Hutchinson', number: 13, role: 'MID' },
      { name: 'Jonathan David', number: 10, role: 'MID' },
      { name: 'Tajon Buchanan', number: 17, role: 'MID' },
      { name: 'Cyle Larin', number: 9, role: 'FWD' },
      { name: 'Iké Ugbo', number: 11, role: 'FWD' },
    ],
  },
  Türkiye: {
    formation: '4-3-3',
    players: [
      { name: 'Uğurcan Çakır', number: 1, role: 'GK' },
      { name: 'Zeki Çelik', number: 2, role: 'DEF' },
      { name: 'Merih Demiral', number: 3, role: 'DEF' },
      { name: 'Abdülkerim Bardakcı', number: 4, role: 'DEF' },
      { name: 'Ferdi Kadıoğlu', number: 20, role: 'DEF' },
      { name: 'Hakan Çalhanoğlu', number: 10, role: 'MID' },
      { name: 'İsmail Yüksek', number: 5, role: 'MID' },
      { name: 'Arda Güler', number: 8, role: 'MID' },
      { name: 'Kenan Yıldız', number: 7, role: 'FWD' },
      { name: 'Barış Alper Yılmaz', number: 11, role: 'FWD' },
      { name: 'Cenk Tosun', number: 9, role: 'FWD' },
    ],
  },
  Scotland: {
    formation: '3-5-2',
    players: [
      { name: 'Angus Gunn', number: 1, role: 'GK' },
      { name: 'Grant Hanley', number: 5, role: 'DEF' },
      { name: 'Jack Hendry', number: 13, role: 'DEF' },
      { name: 'Kieran Tierney', number: 3, role: 'DEF' },
      { name: 'Andrew Robertson', number: 3, role: 'MID' },
      { name: 'Scott McTominay', number: 8, role: 'MID' },
      { name: 'Billy Gilmour', number: 6, role: 'MID' },
      { name: 'John McGinn', number: 7, role: 'MID' },
      { name: 'Che Adams', number: 10, role: 'MID' },
      { name: 'Lyndon Dykes', number: 9, role: 'FWD' },
      { name: 'Lawrence Shankland', number: 11, role: 'FWD' },
    ],
  },
  Ecuador: {
    formation: '4-4-2',
    players: [
      { name: 'Hernán Galíndez', number: 1, role: 'GK' },
      { name: 'Angelo Preciado', number: 17, role: 'DEF' },
      { name: 'Piero Hincapié', number: 3, role: 'DEF' },
      { name: 'Félix Torres', number: 2, role: 'DEF' },
      { name: 'Pervis Estupiñán', number: 7, role: 'DEF' },
      { name: 'Moisés Caicedo', number: 23, role: 'MID' },
      { name: 'Carlos Gruezo', number: 8, role: 'MID' },
      { name: 'Kendry Páez', number: 10, role: 'MID' },
      { name: 'Enner Valencia', number: 13, role: 'MID' },
      { name: 'Willian Pacho', number: 4, role: 'FWD' },
      { name: 'Jordy Caicedo', number: 9, role: 'FWD' },
    ],
  },
}

const DEFAULT_FORMATION: FormationCode = '4-3-3'

function templateSquad(team: string): TeamSquad {
  const roles: PlayerRole[] = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD']
  const players = roles.map((role, i) => ({
    name: `${team} Player ${i + 1}`,
    number: i + 1,
    role,
  }))
  return { team, formation: DEFAULT_FORMATION, players, bench: [] }
}

export function getTeamSquad(team: string): TeamSquad {
  const data = SQUAD_DATA[team]
  if (!data) return templateSquad(team)

  const formation = (['4-3-3', '4-4-2', '3-5-2', '4-2-3-1'] as FormationCode[]).includes(
    data.formation,
  )
    ? data.formation
    : DEFAULT_FORMATION

  return {
    team,
    formation,
    players: data.players,
    bench: data.bench ?? [],
  }
}

export function listTeamsWithSquads(): string[] {
  return getWcTeams()
}
