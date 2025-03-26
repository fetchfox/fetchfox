import { fox } from '../../src/index.js';
import { itRunMatrix, runMatrix } from '../lib/index.js';
import { standardMatrix } from '../lib/matrix.js';
import { checkItemsAI } from '../lib/checks.js';

describe('extract old.reddit.com', async function() {
  const matrix = standardMatrix();

  const expected = [
    {
      "usernme": "arbucklej",
      "text": "Feels weird, baby",
      "tone": "quirky"
    },
    {
      "usernme": "RiderNo51",
      "text": "I'm over 50, and built like that. Maybe there's a future NFL career for me? ðŸ’ª",
      "tone": "wry humor"
    },
    {
      "usernme": "foothah",
      "text": "<image>\n\nNot sexy enough for you?",
      "tone": "teasing sarcasm"
    },
    {
      "usernme": "OttoVonWong",
      "text": "Sir, this is a McCorkleâ€™s.",
      "tone": "Polite"
    },
    {
      "usernme": "Poldi1",
      "text": "Experience is worth a lot",
      "tone": "appreciative"
    },
    {
      "usernme": "NK84321",
      "text": "Feels better watching the last guy to wear #10.\n\nRonnie fucking Bell.",
      "tone": "sarcastically irreverent"
    },
    {
      "usernme": "GutBeater3000",
      "text": "It's the top comment and it's only been 30 minutes...",
      "tone": "excited"
    },
    {
      "usernme": "gridhooligan",
      "text": "Underrated comment ðŸ¤",
      "tone": "positive admiration"
    },
    {
      "usernme": "IntrepidEast7304",
      "text": "Still underrated tbh\n\nNeeds to be even toppier",
      "tone": "informal, confident"
    },
    {
      "usernme": "spermdonor",
      "text": "Freddie Mercury top",
      "tone": "enthusiastic praise"
    },
    {
      "usernme": "Darth_Lord_Stitches",
      "text": "Literally first thing I thought of lol",
      "tone": "casual humor"
    },
    {
      "usernme": "StraightProgress5062",
      "text": "",
      "tone": "Neutral"
    },
    {
      "usernme": "Vondelsplein",
      "text": "Def a bottom",
      "tone": "insulting"
    },
    {
      "usernme": "Juhana21",
      "text": "Ooooooh. I like it now. Glock Purdy and Mac-10",
      "tone": "excited"
    },
    {
      "usernme": "Succorro_Psycho",
      "text": "Maby we draft Tet McMillan? ðŸ¤”",
      "tone": "wry humor"
    },
    {
      "usernme": "MyDogYawns",
      "text": "theyre perfect for hitting Ricky right in the chest",
      "tone": "playfully violent"
    },
    {
      "usernme": "DirtyRoller",
      "text": "Now who gonna be our Tec 9?\n\nTerique Owens number swap? Teq 9? ðŸ¤”",
      "tone": "edgy aggressive"
    },
    {
      "usernme": "NK84321",
      "text": "ðŸ˜­ðŸ˜­ðŸ˜­ðŸ˜­",
      "tone": "playful"
    },
    {
      "usernme": "Bpese",
      "text": "Mac 10",
      "tone": "edgy"
    },
    {
      "usernme": "Pizzledrip",
      "text": "Stop guys, Ricky is rocking himself nervously in a dark corner.",
      "tone": "nervous humor"
    },
    {
      "usernme": "SupaFlyslammajammazz",
      "text": "Fo life yeah!",
      "tone": "casual upbeat"
    },
    {
      "usernme": "ositola",
      "text": "Bruh",
      "tone": "casual"
    },
    {
      "usernme": "eyeamthedanger",
      "text": "Stat Padford?",
      "tone": "Urgent inquiry"
    },
    {
      "usernme": "eyeamthedanger",
      "text": "No, I get it. It just doesn't make sense. I don't remember Lions fans calling him that, and it fits with his number but doesn't fit with his name (at least Brock rhymes with glock). Personally I would go with Gat Stafford or something like that.",
      "tone": "sarcastic"
    },
    {
      "usernme": "Taranchulla",
      "text": "Yeah, PTSD is so hilarious /s",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "kopecs",
      "text": "First thing that came to my mind lol",
      "tone": "humorous"
    },
    {
      "usernme": "Cheap_Lettuce5711",
      "text": "He's #9 so we've been calling him glock-9 since 2021",
      "tone": "playful banter"
    },
    {
      "usernme": "FS_Slacker",
      "text": "If only a handful of people call him thatâ€¦it really doesnâ€™t count. I live in SoCal and have never heard that.",
      "tone": "dismissive skepticism"
    },
    {
      "usernme": "Never-Bloomberg",
      "text": "Mac Jones literally trademarked that or whatever for his brand or whatever. That's why he likes 10.",
      "tone": "casual humorous"
    },
    {
      "usernme": "SimonMamon49",
      "text": "Excellent work",
      "tone": "Positive"
    },
    {
      "usernme": "brethart2007",
      "text": "Burt Mac-10: FBI",
      "tone": "Menacing"
    },
    {
      "usernme": "Cheap_Lettuce5711",
      "text": "Omg lol y'all taking Staffords nickname Glock-9 ðŸ¤£",
      "tone": "playful sarcasm"
    },
    {
      "usernme": "dwide_k_shrude",
      "text": "",
      "tone": "Neutral"
    },
    {
      "usernme": "maparo",
      "text": "Honestly, this is perfectly fitting. He is Jimmy 2.0",
      "tone": "complimentary"
    },
    {
      "usernme": "PurdyChosenOne69",
      "text": "Heâ€™s prob better than Jimmy but itâ€™s hard to say. Patriots was in total rebuild when mac jones was given the keys. He never stood a chance. Bad oline, bad weapon, bad coaching.",
      "tone": "sarcastic criticism"
    },
    {
      "usernme": "after_Andrew",
      "text": "that gut is def 2x jimmy",
      "tone": "casual playful"
    },
    {
      "usernme": "OptimusToast",
      "text": "This is a crazy thing to say",
      "tone": "incredulous"
    },
    {
      "usernme": "SuperbDrink6977",
      "text": "Ainâ€™t no way he better than Jimmy",
      "tone": "casual dismissive"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "That's a pretty low bar to clear lol",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "BoogaRadley",
      "text": "This is one of the most insane things Iâ€™ve ever read",
      "tone": "incredulous astonishment"
    },
    {
      "usernme": "pineappleshnapps",
      "text": "You know, itâ€™s really fucking not. Why do you think weâ€™ve only had one Qb better than him since maybe Jeff Garcia or Alex smith at his best",
      "tone": "sarcastic, dismissive"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Lol I knew it was absurdly low number. It's amazing how little they incorporated the QB in a playoff game.",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "DaSuHouse",
      "text": "People forget how good Jimmy was before the ACL injuries and concussions. Donâ€™t think Mac Jones compares at all.",
      "tone": "nostalgic dismissive"
    },
    {
      "usernme": "NK84321",
      "text": "You're wrong, Jimmy completed 6 passes in that game. Out of 8 attempts.",
      "tone": "assertive correction"
    },
    {
      "usernme": "HillTower160",
      "text": "I never saw Jimmy lead a receiver. He was always throwing behind. Nice guy - glad heâ€™s gone.",
      "tone": "sarcastic farewell"
    },
    {
      "usernme": "silverfox762",
      "text": "Ewwwwwww. Staaaahp.",
      "tone": "disgust"
    },
    {
      "usernme": "jamison_311",
      "text": "Better than a kick/punt returner wearing 10",
      "tone": "boastful"
    },
    {
      "usernme": "dadalwayssaid",
      "text": "they literally gave it to ronnie bell..... which is a insult",
      "tone": "insulting"
    },
    {
      "usernme": "stopthecapboi",
      "text": "Yes itâ€™s kinda weird but, so is Jimmy g in a rams jersey. Someone was gonna take the number at some point",
      "tone": "quirky humor"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Jimmy was good because he was carried. Which is why he immediately got exposed going to Vegas. This team won a playoff game with him completing 8 passes. This is revisionist history. Jimmy was good because he was being compared to Giovanni Carmazzi and fucking Jim Drunkenmiller.",
      "tone": "sarcastic irreverence"
    },
    {
      "usernme": "ImHaze23",
      "text": "Shouldâ€™ve been retired imo",
      "tone": "critical"
    },
    {
      "usernme": "FoogYllis",
      "text": "Besides it was with Ronnie Bell last and not Jimmy G.",
      "tone": "wry humor"
    },
    {
      "usernme": "StatusIcy3098",
      "text": "Now that is funny. Iâ€™ll be laughing about this one over a beer for a while. Niners QBs that have retired jersey numbers: Joe Montana, Steve Young, John Brodie. So either leading the team to multiple (more than 2) NFC championships and at least 1 Super Bowl win or in the case of Brodie, 17 seasons with the Niners with 13 seasons as starting QB. Nah, Jimmy never came close to that level.",
      "tone": "humorous"
    },
    {
      "usernme": "stopthecapboi",
      "text": "Oh shit, Iâ€™ve fully tried to block him from my memory. I take it all back, burn the jersey",
      "tone": "angry defiance"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "",
      "tone": "Neutral"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Jimmy should have been retired or his number?? I know you're not saying his number should have been retired lol",
      "tone": "playful sarcasm"
    },
    {
      "usernme": "FS_Slacker",
      "text": "Jimmy had that quick release and was very accurate on those short-intermediate routes.",
      "tone": "admiring"
    },
    {
      "usernme": "TheLastOpus",
      "text": "We didn't even win a SB with him and many blame him for the loss. He isn't even close to HOF while the hell would we retire Jimmy G's jersey, I know this is a troll comment, but not even as a joke.",
      "tone": "sarcastic, mocking"
    },
    {
      "usernme": "dildobaggins55443322",
      "text": "Sorry but 10 feels like a tainted number to me. Jimmy Garoppolo, Kyle Williams, and Ronnie Bell. Jimmy G was the only one worth half a nickel out of the bunch. I feel Mac jones will keep the tradition of mid players wearing #10\n\nSorry to all the Jimmy G lovers out there but he was just the best qb we had in a while and that wasnâ€™t saying much.",
      "tone": "sarcastic critique"
    },
    {
      "usernme": "dances_with_fentanyl",
      "text": "Hmm I wonder if he could hit a wide open Emanuel Sanders in the Superbowl?",
      "tone": "curious"
    },
    {
      "usernme": "233up",
      "text": "I'm so sick of this narrative. Manny pulled up on the route, clear as day. This is my hill.",
      "tone": "Angry, defiant"
    },
    {
      "usernme": "ehundred",
      "text": "Idk bout wide open but at least somewhere he could go up for it. Maybe draw a PI",
      "tone": "casual, humorous"
    },
    {
      "usernme": "LikwidDef",
      "text": "Enjoy dying on your hill. Jimmy G was the reason.",
      "tone": "sarcastic defiance"
    },
    {
      "usernme": "MrEnchilada26",
      "text": "Put some respect on Jimothyâ€™s name.",
      "tone": "demanding respect"
    },
    {
      "usernme": "lobo_blanco_0257",
      "text": "God, he was dreamy.",
      "tone": "dreamy admiration"
    },
    {
      "usernme": "lobo_blanco_0257",
      "text": "I kinda miss Jimmy G being on the team. Not necessarily as the starter, just on the team. Those were good times.",
      "tone": "nostalgic"
    },
    {
      "usernme": "IronFizt777",
      "text": "You don't miss him you just miss his jawline",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "IronFizt777",
      "text": "<image>",
      "tone": "Neutral"
    },
    {
      "usernme": "mvp713",
      "text": "i certainly miss 2017 jimmy and that 2018 jimmy that was about to lead a comeback in that regular season game against the chiefs.",
      "tone": "nostalgic"
    },
    {
      "usernme": "ConfidentCamp5248",
      "text": "You donâ€™t miss him, you just miss that era. Lol",
      "tone": "Witty nostalgia"
    },
    {
      "usernme": "dancmc12",
      "text": "The week 18 game gonna be lit",
      "tone": "energetic"
    },
    {
      "usernme": "karavasis",
      "text": "He doesnâ€™t have the jaw nor the smile to don a perfect 10",
      "tone": "sarcastic critique"
    },
    {
      "usernme": "Beardmanta",
      "text": "If Jimmy doesn't overthrow Sanders on the one throw think about how much of a butterfly effect that would have.\n\nMac Jones certainly wouldn't be #10.",
      "tone": "wry humor"
    },
    {
      "usernme": "KeithClossOfficial",
      "text": "I like Jimmy but itâ€™s weird how people are acting like his number should be retired.\n\nKaep took us to a Super Bowl too, should Mooney not have been able to wear 7?",
      "tone": "ironic, questioning"
    },
    {
      "usernme": "Hop830",
      "text": "Mahomes was still getting another possession even if they connect.",
      "tone": "observational, neutral"
    },
    {
      "usernme": "Plasma_Cosmo_9977",
      "text": "What, cuz of JimmyG?! Pfft, it's a football team. There's only so many numbers.",
      "tone": "sarcastic dismissive"
    },
    {
      "usernme": "7fingersDeep",
      "text": "All the Latina MILFs in the Bay Area are on high alert now.",
      "tone": "provocative"
    },
    {
      "usernme": "CosmicBruce",
      "text": "Big ðŸ“ Brock and Big ðŸ” Jones",
      "tone": "energetic"
    },
    {
      "usernme": "bick512",
      "text": "Thus is the passage of every Patriots QB through the halls of Santa Clara",
      "tone": "ironic commentary"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Are we pretending Jimmy should have his number retired or something??",
      "tone": "sarcastic questioning"
    },
    {
      "usernme": "SleepIsWonderful",
      "text": "Yeah I don't get it. Were people mad at Ward for wearing 7?",
      "tone": "confused, questioning"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Right they act like he went out there wearing 16 or 8 lol.",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "RiderNo51",
      "text": "I think it's because Jones just flat out sucks. Jimmy had some excellent years, gave all he had as a loyal teammate, gave his body to the game basically before it betrayed him.",
      "tone": "Critical nostalgic"
    },
    {
      "usernme": "ezrasharpe",
      "text": "Nostalgia is a hell of a drug, jesus",
      "tone": "Playfully nostalgic"
    },
    {
      "usernme": "extremewit",
      "text": "Iâ€™m fine with it as long as they donâ€™t ask him to return punts.",
      "tone": "casual"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Bruh....",
      "tone": "casual"
    },
    {
      "usernme": "Lost-Meat-7428",
      "text": "Saying jimmy had some excellent years is a bit of an overstatement. His ceiling was Alex Smith under Harbaugh.",
      "tone": "wry sarcasm"
    },
    {
      "usernme": "rg4rg",
      "text": "Therapist: â€œâ€¦.you say you are, but I donâ€™t think youâ€™re over your exâ€¦â€",
      "tone": "cautiously skeptical"
    },
    {
      "usernme": "ursasmaller",
      "text": "Guessing Mac will not be Ritaâ€™s muse.",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "The49GiantWarriors",
      "text": "Jimmy isn't a legend. #10 gets passed around until someone forces its retirement.",
      "tone": "sarcastic dismissiveness"
    },
    {
      "usernme": "NetworkDeestroyer",
      "text": "Hope bro learns and develops, Darnold grew from that. I felt bad for Mac when McDaniels leaves out for the HC job. If McDaniels stayed as OC feel like we wouldâ€™ve seen a different Mac.",
      "tone": "bittersweet reflective"
    },
    {
      "usernme": "Fun-Needleworker7954",
      "text": "I have a Jimmy jersey still and Iâ€™ve been waiting for a players worthy of a nameplate swap. Iâ€™m thinking Mac-10",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "LossyP",
      "text": "This number needs to be retired for all the wrong reasons.",
      "tone": "sarcastic"
    },
    {
      "usernme": "eh49er",
      "text": "I'm fine with Mac wearing it to keep it away from any WRs",
      "tone": "casually agreeable"
    },
    {
      "usernme": "scdjsc",
      "text": "Ronnie Bell must be rolling in his grave rn",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "Xavier050822",
      "text": "Heâ€™s not handsome enough to wear 10. However, he might honor 10 by throwing picks to LBs and hanging hospital balls. So Iâ€™m really conflicted now lol.",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "dhal392",
      "text": "Itâ€™s either heâ€™s wearing it or Ronnie Bell isâ€¦so..lol",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Jimmy has been talking trash about the Niners since he left and now some of yall mad someone took his old number. Like what??",
      "tone": "sarcastic mocking"
    },
    {
      "usernme": "lavender-lover",
      "text": "The Niners fans talked trash about Jimmy G since day one so I don't blame him",
      "tone": "playfully mocking"
    },
    {
      "usernme": "chibi75",
      "text": "Look, Iâ€™ve always liked Jimmy, and Iâ€™m just going to pretend Mac Jones has another number on.",
      "tone": "playfully ironic"
    },
    {
      "usernme": "Key_Power_1193",
      "text": "Lmao stop simping. Attacking the organization doesn't attack the fans. He's very clearly talking about the organization as a whole. Your logic doesn't make sense. It's OK to trash talk the team because some fans voiced their opinions about how bad he is. ðŸ¤¦ðŸ¾â€â™‚ï¸ðŸ¤¦ðŸ¾â€â™‚ï¸",
      "tone": "sarcastic"
    },
    {
      "usernme": "jxs74",
      "text": "Letâ€™s get rrrrrrrrrrrrreaaaaaaaaadyyyy to FUUUUUMBLEEEEEEE!",
      "tone": "Excited"
    },
    {
      "usernme": "9erlife",
      "text": "Jim Jones. Donâ€™t drink the kool-aid.",
      "tone": "cautionary, ironic"
    },
    {
      "usernme": "liteshadow4",
      "text": "Was supposed to be Garoppolo's heir in 2021",
      "tone": "sarcastic"
    },
    {
      "usernme": "jks182",
      "text": "Some of you all take the number game way too seriously. Enjoy #10, Jimmy. I mean Mac.",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "Accurate-Currency181",
      "text": "I love it!",
      "tone": "positive"
    },
    {
      "usernme": "ZezilEstex74",
      "text": "Why?",
      "tone": "questioning"
    },
    {
      "usernme": "segawdcd",
      "text": "Would it be worse than drafting Kyle Williams and having him wear 10?",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "RealisticTea4605",
      "text": "White Boy Summer.",
      "tone": "confident provocative"
    },
    {
      "usernme": "ChickenTendies4Me",
      "text": "(Random cell phone camera pans to him in an Alabama bar) Make more money, hunned mil",
      "tone": "boastful, irreverent"
    },
    {
      "usernme": "onsmash2004",
      "text": "Crack Jones",
      "tone": "quirky humor"
    },
    {
      "usernme": "JayChucksFrank",
      "text": "Is it?",
      "tone": "questioning"
    },
    {
      "usernme": "luckyselection_7728",
      "text": "Number ten should be retired as the sexiest qb to ever play on the 49ers",
      "tone": "playful admiration"
    },
    {
      "usernme": "UpdogSinclair",
      "text": "Nobody is going to make me feel bad about Mac Jones being out back up.",
      "tone": "confident defiance"
    },
    {
      "usernme": "PurdyDamnGood",
      "text": "Weâ€™re living in a simulation",
      "tone": "existential"
    },
    {
      "usernme": "Educational_Scar_933",
      "text": "China Doll 2.0 ffs",
      "tone": "irate sarcasm"
    },
    {
      "usernme": "Cjhudel",
      "text": "They are basically the same player",
      "tone": "neutral"
    },
    {
      "usernme": "TwoElectronic1425",
      "text": "Jimmy Benedict G shouldnâ€™t have his number protected",
      "tone": "critical"
    },
    {
      "usernme": "rcallen57",
      "text": "8 - 16 - and 12 are off limits. Other than that, who cares..",
      "tone": "sarcastic indifference"
    },
    {
      "usernme": "Lost-Meat-7428",
      "text": "Oh dear god.. if anything, between Jimmy and Kyle Williams the 10 jersey should be permanently retired",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "CocaineNapTime",
      "text": "Jimmy G was a fine QB that was either slightly underrated or extremely overrated depending on which 49ers fan you talk to. Iâ€™m glad that era is over and we have Brock now.",
      "tone": "wry commentary"
    },
    {
      "usernme": "KonaKumo",
      "text": "Am I missing something? Only number 10 I remember is Jimmy G. He didn't perform well enough to have his number be sacred.",
      "tone": "wry skepticism"
    },
    {
      "usernme": "totallynotricky",
      "text": "Well Jimmy g sucked so cares",
      "tone": "dismissive"
    },
    {
      "usernme": "SchrodingersWetFart",
      "text": "I'm never going to understand the Jimmy reverence... and I should stop trying.",
      "tone": "resigned confusion"
    },
    {
      "usernme": "tallwhiteninja",
      "text": "Oh, boy. Being SUPER generous:\n\nMontana\n\nYoung\n\nBrodie\n\nTittle\n\nGarcia\n\nPurdy\n\nKaepernick\n\nSmith\n\nAlbert (so old school, his best years were in the AAFC, not the NFL)\n\n...we're down to DeBerg and Plunkett, neither of whom was especially great and both had their best seasons elsewhere. Pretty sure Jimmy G makes the top 10, lol. Realistically, I'd probably put him around or above Kaepernick and Smith (ignoring Smith's Chiefs years and only counting what he did for us).",
      "tone": "irreverent humor"
    },
    {
      "usernme": "djeldeafo20",
      "text": "What did Jimmy g ever do to make it seem weird Mac is wearing #10? Jimmy g sucks lmao not weird at all and that jersey never going to be retired or honored because of Jimmy g",
      "tone": "sarcastic mocking"
    },
    {
      "usernme": "el_sandino",
      "text": "Iâ€™m sure Kyle Williams is really insulted lol. Who cares? Jimmy doesnâ€™t crack our top 10 best QBs",
      "tone": "sarcastic"
    },
    {
      "usernme": "el_sandino",
      "text": "I knew it was a stretch lol but I like stirring the pot in here. \n\nBut one important omission from your listâ€¦ how could you forget NCAA passing record holder* TIM RATTAY?!? ðŸ˜‚",
      "tone": "sarcastic humor"
    },
    {
      "usernme": "RatedR2O",
      "text": "Curious to see who you rank in the top 10 49ers QBs.",
      "tone": "inquisitive"
    },
    {
      "usernme": "233up",
      "text": "Sssttttttaaaaaaahhhhhhppppppp ðŸ˜‚ðŸ˜‚ðŸ˜‚ðŸ˜‚ðŸ˜‚",
      "tone": "playful dismissal"
    },
    {
      "usernme": "Cleverironicusername",
      "text": "Heâ€™s not my #10.",
      "tone": "sarcastic"
    },
    {
      "usernme": "Amdvoiceofreason",
      "text": "Bruh",
      "tone": "casual"
    },
    {
      "usernme": "GalacticBaz",
      "text": "<image>",
      "tone": "Neutral"
    },
    {
      "usernme": "SaucyLemon69",
      "text": "Better than Jimmy G",
      "tone": "boastful"
    },
    {
      "usernme": "Successful_Truck3559",
      "text": "Bro. Come on.",
      "tone": "casual disbelief"
    },
    {
      "usernme": "RawrGeeBe",
      "text": "Traded the farm for Trey Lance instead of waiting for these bums to flame out with their 1st teams.",
      "tone": "sarcastic"
    },
    {
      "usernme": "SaucyLemon69",
      "text": "Jimmy was shit",
      "tone": "insulting"
    },
    {
      "usernme": "lelanddt",
      "text": "Stop it. Get some help.",
      "tone": "brusque"
    }
  ];

  const cases = [
    // Live has more comments than saved, disable it for now

    // {
    //   name: 'live',
    //   url: 'https://old.reddit.com/r/49ers/comments/1ji59qa/the_blasphemy_of_mac_jones_wearing_10/',
    //   expected,
    // },

    {
      name: 'saved',
      url: 'https://ffcloud.s3.us-west-2.amazonaws.com/fetchfox-docs/j9mybp2xav/https-old-reddit-com-r-49ers-comments-1ji59qa-the-blasphemy-of-mac-jones-wearing-10-.html',
      expected,
    },
  ];

  const questions = {
    usernme:	'What is the username for the comment',
    text: 'What is the text of the comment',
    tone: 'What is the tone of the comment? 1-3 words',
  }

  for (const { name, url, expected } of cases) {
    const wf = await fox
      .init(url)
      .extract({ questions })
      .limit(500)
      .plan();

    return itRunMatrix(
      it,
      `extract old.reddit.com comment thread (${name})`,
      wf.dump(),
      matrix,
      [
        (items) => checkItemsAI(items, expected, questions),
      ],
      { shouldSave: true });
  }
});
