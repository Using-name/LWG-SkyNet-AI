/**Deadly default AI
 * 
 * Version 1.1.4 Beta
 * 
 * Made by a totally not egotistcal, super awesome, cofee hating, and 
 * incredibly skilled and unparalled programer, 
 * Mr. Meow Meow! 
 * 
 * Questions? Comments? Come see me in the discord, in #AI-Discussion.
 * Concerns? Complaints? Please refer to the Department of Nobody Cares. And
 * yes, I am the manager.
 */

const me = scope.getMyPlayerNumber();
const time = Math.round(scope.getCurrentGameTimeInSec());
const tick = scope.getCurrentGameTimeInSec() * 20;//Game tick
let gold = scope.getGold();
const myTeam = scope.getMyTeamNumber();

const supply = scope.getCurrentSupply();
const maxSupply = scope.getMaxSupply();
const supplyDiff = maxSupply - supply;//supply differenece

let fightingUnits = scope.getUnits({notOfType: "Worker", player: me}); // returns all own fighting units (=not workers)
for(let i = fightingUnits.length - 1; i > -1; i--){
    fightingUnits[i].getTypeName() == "Airship" ? fightingUnits.splice(i, 1) : null;
}
const idleFightingUnits = scope.getUnits({notOfType: "Worker", player: me, order: "Stop"});
const myUnits = {};
scope.getUnits({player: me}).forEach(function(unit){
    let name = unit.getTypeName();
    if(myUnits[name] != undefined){
        myUnits[name].push(unit);
    }else{
        myUnits[name] = [];
        myUnits[name].push(unit);
    }
});//Note that if you do not have a unit of a certain type, acessing 
//myUnits[nonExistantUnitName] will return undefined. 

let enemyUnits = scope.getUnits({enemyOf: me});
for(let i = enemyUnits.length - 1; i > -1; i--){
    enemyUnits[i].isNeutral() && enemyUnits.splice(i, 1);
}
const enemyFightingUnits = scope.getUnits({notOfType: "Worker", enemyOf: me});
let notMyBuildings = scope.getBuildings({enemyOf: me});
let enemyBuildings = [];
notMyBuildings.forEach(function(build){
	if(build.isNeutral() === false){
		enemyBuildings.push(build);
	}
});//Copied from @BrutalityWarlord's AI; filters out enemy units from neutral units
let myMechUnits = [];
const enemyRanged = [];
const enemyMelee = [];
enemyFightingUnits.forEach(function(unit){
    if(unit.getFieldValue("range") > 1){
        enemyRanged.push(unit);
    }else{
        enemyMelee.push(unit);
    }
});
const myMelee = [];
const myRanged = [];
fightingUnits.forEach(function(unit){
    unit.getFieldValue("range") > 1 ? myRanged.push(unit) : myMelee.push(unit);
});

if(myUnits["Ballista"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Ballista"]);
}
if(myUnits["Catapult"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Catapult"]);
}
if(myUnits["Gatling Gun"] != undefined){
    myMechUnits = myMechUnits.concat(myUnits["Gatling Gun"]);
}

let myBuilds = {
    "allBuilds": scope.getBuildings({player: me}),
    "Castles": scope.getBuildings({type: "Castle", player: me}),
    "Fortresses": scope.getBuildings({type: "Fortress", player: me}),
    "Barracks": scope.getBuildings({type : "Barracks", player: me}),
    "Houses": scope.getBuildings({type: "House", player: me}),
    "Watchtowers": scope.getBuildings({type: "Watchtower", player: me}),
    "Forges": scope.getBuildings({type: "Forge", player: me}),
    "Churches": scope.getBuildings({type: "Church", player: me}),
    "Mages Guilds": scope.getBuildings({type: "Mages Guild", player: me}),
    "Armories": scope.getBuildings({type: "Armory", player: me}),
    "Wolves Dens": scope.getBuildings({type: "Wolves Den", player: me}),
    "Werewolves Dens": scope.getBuildings({type: "Werewolves Den", player: me}),
    "Animal Testing Labs": scope.getBuildings({type: "Animal Testing Lab", player: me}),
    "Dragon Lairs": scope.getBuildings({type: "Dragons Lair", player: me}),
    "Workshops": scope.getBuildings({type: "Workshop", player: me}),
    "Advanced Workshops": scope.getBuildings({type: "Advanced Workshop", player: me}),
    "Mills": scope.getBuildings({type: "Mill", player: me}),
    "Snake Charmers": scope.getBuildings({type: "Snake Charmer", player: me}),
}
myBuilds.combatUnitProducers = myBuilds["Churches"].concat(myBuilds["Wolves Dens"].concat(myBuilds["Dragon Lairs"].concat(myBuilds["Workshops"].concat(myBuilds["Advanced Workshops"].concat(myBuilds["Mills"].concat(myBuilds["Barracks"].concat(myBuilds["Werewolves Dens"])))))));
let alliedBuilds = scope.getBuildings({team: myTeam});
let goldmines = scope.getBuildings({type: "Goldmine"});

if(scope.initailized === true && myBuilds.combatUnitProducers.length > 1){
    filterDontProducers();
}

myBuilds.CastleAndFortresses = myBuilds["Fortresses"].concat(myBuilds["Castles"]);//Fortresses should be the first castle the bot has, so therefore
//it is concated into castles. Newest castles/fortresses should be at the back, oldest at the front. Messing with the order will cause problems.

let idleWorkers = scope.getUnits({type: "Worker", player: me, order: "Stop"});
let allWorkers = scope.getUnits({type: "Worker", player: me});
let miningWorkers = scope.getUnits({type: "Worker", player: me, order: "Mine"});
let repairingWorkers = scope.getUnits({type: "Worker", player: me, order: "Repair"});
let workerToCastleRatio = Math.ceil(miningWorkers.length / myBuilds["CastleAndFortresses"].length);//how many workers there are for each castle.

let combatUnitProducerToCastleRatio = myBuilds.combatUnitProducers.length / (scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}).concat(myBuilds["Fortresses"])).length;
/**
 * Gets random numbers. See methods inside for details.
 */
class Randomizer {
    //CREDIT GOES TO @Jermy Keeshin at CodeHS
    
    //https://static1.codehs.com/gulp/1edc730c184f9950e19e21d320171c1b14507618/jsdoc/chs-js-lib/graphics_randomizer.js.html
    /**
     * Get a random integer between low to high, inclusive.
     * If only one parameter is given, a random integer
     * from (0, low-1) inclusive.
     * @param {number} low - Lower bound on range of random int.
     * @param {number} high - Upper bound on range of random int.
     * @returns {number} Random number between low and high, inclusive.
    */
    static nextInt(low, high){
        return Math.round(scope.getRandomNumber(low, high));
    };
    /**
     * Get a random float between low to high, inclusive.
     * If only one parameter is given, a random float
     * from (0, low-1) inclusive.
     * @param {number} low - Lower bound on range of random int.
     * @param {number} high - Upper bound on range of random int.
     * @returns {number} Random number between low and high, inclusive. Up to 6 digits total.
    */
    static nextFloat(low, high){
        return scope.getRandomNumber(low, high);
    };
    /**
     * Generate a random boolean via fair probability coin toss.
     * If `probabilityTrue` is supplied, the coin toss is skewed by that value.
     * @param {number} probabilityTrue - Skewed probability of true.
     * @returns {boolean} Result of coin flip skewed toward `probabilityTrue`. 
    */
    static nextBoolean(probabilityTrue){
        if(typeof probabilityTrue === "undefined"){
            probabilityTrue = 0.5;
        }
        return scope.getRandomNumber(0, 1) < probabilityTrue;
    };
}

if(!scope.initailized){
   scope.initailized = true;
   /**
     * Gets the combat power of a unit. If the unit
     * is not defined in scope.unitPower, it will 
     * return 0.
     * 
     * @param {unit} unit - the unit to be measured
     * 
     * @returns {number} - the combat power of the unit
     */
    scope.getPowerOf = function(unit){
        try{
            if(unit != undefined && unit.getCurrentHP() > 0 && scope.unitPower[unit.getTypeName()] != undefined){
                return scope.unitPower[unit.getTypeName()] * (unit.getValue("hp") / unit.getFieldValue("hp"));
            }else{
                return 0;
            }
        }catch(e){
            throw new Error(JSON.stringify(unit));
        }
    }
    
    scope.nextTalkTick = Randomizer.nextInt(5, 10);

    //The sizes of various buildings. [length, width]
    scope.buildingSizes = {
        "House": [3, 3],
        "Barracks": [3, 3],
        "Watchtower": [2, 2],
        "Forge": [4, 4],
        "Castle": [4, 4],
        "Fortress": [4, 4],
        "Church": [4, 4],
        "Mages Guild": [3, 3],
        "Armory": [3, 3],
        "Wolves Den": [3, 3],
        "Animal Testing Lab": [4, 4],
        "Dragons Lair": [3, 3],
        "Workshop": [4, 4],
        "Advanced Workshop": [4, 4],
        "Mill": [4, 4],
        "Snake Charmer": [2, 2],
    }
    
    //Priorities of various buildings. A higher priority means a unit is more likely
    //to be picked.
    scope.buildPrio = {
        "House": 0,
        "Barracks": 0,
        "Watchtower": 0,
        "Forge": 0,
        "Castle": 0,
        "Church": 0,
        "Mages Guild": 0,
        "Armory": 0,
        "Wolves Den": 0,
        "Animal Testing Lab": 0,
        "Dragons Lair": 0,
        "Workshop": 0,
        "Advanced Workshop": 0,
        "Mill": 0,
        "Snake Charmer": 0,
    }
    
    //Same thing as above, only with units
    scope.unitPrio = {
        "Worker": 0,
        "Bird": 0,
        "Ballista": 0,
        "Soldier": 0,
        "Archer": 0,
        "Mage": 0,
        "Priest": 0,
        "Raider": 0,
        "Snake": 0,
        "Wolf": 0,
        "Werewolf": 0,
        "Dragon": 0,
        "Gyrocraft": 0,
        "Gatling Gun": 0,
        "Catapult": 0,
        "Airship": 0,
    }
    
    //Where a unit is produced. Correlates to myBuilds.
    scope.unitProducedAt = {
        "Bird": "CastleAndFortresses",
        "Worker": "CastleAndFortresses",
        "Soldier": "Barracks",
        "Archer": "Barracks",
        "Mage": "Barracks",
        "Priest": "Churches",
        "Raider": "Barracks",
        "Snake": "Wolves Dens",
        "Wolf": "Wolves Dens",
        "Werewolf": "Werewolves Dens",
        "Dragon": "Dragon Lairs",
        "Gyrocraft": "Mills",
        "Gatling Gun": "Workshops",
        "Catapult": "Workshops",
        "Ballista": "Advanced Workshops",
        "Airship": "Advanced Workshops",
    }

    //The typeName of where each unit is produced at. Uses the typeName,
    //so you can use scope.getBuildings() with this function. Does not
    //correlate with myBuilds.
    scope.unitProducedAtTypeName = {
        "Bird": "Castle",
        "Worker": "Castle",
        "Soldier": "Barracks",
        "Archer": "Barracks",
        "Mage": "Barracks",
        "Priest": "Church",
        "Raider": "Barracks",
        "Snake": "Wolves Den",
        "Wolf": "Wolves Den",
        "Werewolf": "Werewolves Den",
        "Dragon": "Dragon Lair",
        "Gyrocraft": "Mill",
        "Gatling Gun": "Workshop",
        "Catapult": "Workshop",
        "Ballista": "Advanced Workshop",
        "Airship": "Advanced Workshop",
    }//The actualy type name in the game, versus the name in scope.myBuilds.
    
    scope.unitPower = {//used to calculate how much of a threat an enemy is
        "Worker": 0,
        "Soldier": 1,
        "Archer": 1,
        "Mage": 1.25,
        "Priest": 1.2,
        "Raider": 1.25,
        "Wolf": 0.7,
        "Snake": 0.7,
        "Werewolf": 4,
        "Dragon": 1.5,
        "Airship": 0,
        "Gatling Gun": 1.3,
        "Gyrocraft": 1,
        "Catapult": 1.5,
        "Ballista": 1.25,
        "Bird": 0,
        "Healing Ward": 1,
    };

    /**
     * Priorities for various metas.
     * 
     * attackThreshold is the point at which the bot will attack, calculated
     * by the number of combat unit producers (rax, workshops, etc.)
     * multiplied by the attackThreshold.
     */
    scope.allSubMetaPrios = {
        "Barracks": {//Barracks meta
            "Balanced": {
                "Buildings": ["Barracks"],
                "Units": ["Soldier", "Archer", "Raider", "Airship"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 1.8, "maxProducers": 10, "opener": true},
            },
            "Magical": {
                "Buildings": ["Barracks", "Church", "Mages Guild", "Advanced Workshop"],
                "Units": ["Mage", "Priest", "Raider", "Airship"],
                "Upgrades": ["Fireball", "Invisibility", "Forge"],
                "Misc": {"attackThreshold": 1.8, "singleProduction": ["Mages Guild"], "maxProducers": 10, "opener": false},
            }
        },
        "Beast": {//Beast meta
            "WolfSnakeSpam": {
                "Buildings": ["Wolves Den", "Snake Charmer"],
                "Units": ["Wolf", "Snake"],
                "Upgrades": ["Animal Testing Lab"],
                "Misc": {"attackThreshold": 3, "maxProducers": 14, "opener": true},
            },
            "WolfSnakeAndWerewolf": {
                "Buildings": ["Wolves Den", "Snake Charmer"],
                "Units": ["Wolf", "Snake", "Werewolf"],
                "Upgrades": ["Werewolf Den", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 14, "opener": false},
            },
            "WolfSnakeAndDragon": {
                "Buildings": ["Wolves Den", "Snake Charmer", "Dragons Lair"],
                "Units": ["Wolf", "Snake", "Dragon"],
                "Upgrades": ["Fortress", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 14, "opener": false},
            },
            "WolfSpam": {
                "Buildings": ["Wolves Den"],
                "Units": ["Wolf"],
                "Upgrades": ["Animal Testing Lab"],
                "Misc": {"attackThreshold": 2.5, "maxProducers": 16, "opener": true},
            },
            "DragonSpamRush": {
                "Buildings": ["Dragons Lair"],
                "Units": ["Dragon"],
                "Upgrades": ["Fortress", "Animal Testing Lab"],
                "Misc": {"attackThreshold": 1.7, "maxProducers": 12, "opener": false},
            },
        },
        "Mechanical": {//Mech meta
            "CatapultSpam": {
                "Buildings": ["Workshop", "Advanced Workshop"],
                "Units": ["Catapult", "Airship"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2.1, "maxProducers": 10, "opener": false},
            },
            "GatlingGunSpam": {
                "Buildings": ["Workshop"],
                "Units": ["Gatling Gun", "Airship"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2, "maxProducers": 10, "opener": false},
            },
            "CatapultGatlingGunSpam": {
                "Buildings": ["Workshop", "Advanced Workshop"],
                "Units": ["Gatling Gun", "Catapult", "Airship"],
                "Upgrades": ["Forge"],
                "Misc": {"attackThreshold": 2.2, "maxProducers": 10, "opener": true},
            },
            "GyrocraftSpam" : {
                "Buildings": ["Mill"],
                "Units": ["Gyrocraft", "Airship"],
                "Upgrades": ["Forge"],
                "Misc": {"singleProduction": ["Workshop"], "attackThreshold": 3, "maxProducers": 14, "opener": false},
            }
        }
    }
    
    let metas = ["Barracks",
                 "Beast", 
                 "Mechanical"
                 ];//various large-scale strategies the bot can use

    scope.allSubMetas = {
        "Barracks": ["Balanced", "Magical"],
        "Beast": ["WolfSnakeSpam", "WolfSnakeAndWerewolf", "WolfSnakeAndDragon", "WolfSpam", "DragonSpamRush"],
        "Mechanical": ["CatapultSpam", "GatlingGunSpam", "CatapultGatlingGunSpam", "GyrocraftSpam"],
    }//sub-strategies within various metas.
    
    for(let i = 0; i < Randomizer.nextInt(1, 10); i++){
        scope.meta = metas[Randomizer.nextInt(0, metas.length - 1)];//fetches a meta
    }//Oftentimes, several bots in a multiplayer will choose the same meta because 
    //of js magic. This for loop tries to add another layer of randomness to stop that.
    
    while(true){
        for(let i = 0; i < Randomizer.nextInt(1, 5); i++){
            scope.subMeta = scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)];//fetches a submeta
        }
        if(scope.allSubMetaPrios[scope.meta][scope.subMeta]["Misc"].opener == true){
            break;
        }
    }
    

    /**
     * Determines what units the bot will produce, what buildings the bot will
     * build, and what upgrades the bot will pursue. Note that workers are
     * seperate and will always be trained, along with houses, castles, and
     * watchtowers being built
     */
    
    scope.subMetaPrios = scope.allSubMetaPrios[scope.meta][scope.subMeta];
    scope.attackThreshold = scope.subMetaPrios["Misc"].attackThreshold;
    scope.unitProducerCap = scope.subMetaPrios["Misc"].maxProducers;
    
    scope.bases = [];
    scope.doTrainUnits = true;
    scope.doBuildBuildings = true;
    
    scope.maxWorkersOnBase = Randomizer.nextInt(7, 9);
    
    scope.startUnminedMines = getUnminedMines();
    
    scope.underAttack = false;
    
    scope.lastNumOfCastles = 1;//Don't mess with this
    scope.enemyWorkerScouts = [];
    
    scope.canRetreat = true;
    
    scope.dontProduceFromThese = new Set();//Buildings that shouldn't produce anything. They will not count in productionBuildings.
    scope.onlyProduceOneOfThese = [];
    scope.tickrate = {
        "Scout": Randomizer.nextInt(30, 100),
        "Attack": Randomizer.nextInt(20, 30),
        "Defend": Randomizer.nextInt(2, 4),
        "Build": Randomizer.nextInt(3, 6),
        "BuildCastle": Randomizer.nextInt(6, 15),
        "Repair": Randomizer.nextInt(3,5),
        "ArmyBrain": Randomizer.nextInt(2, 3),//kiting, retreating
        "Train": Randomizer.nextInt(2, 4),
    }//how often the bot runs various functions/methods
    
    scope.mechRepairPercent = Randomizer.nextFloat(0.05, 0.15);
    scope.mechRepairSquad = [];
    
    scope.trainingModeOn = false;
	/*
    if(scope.trainingModeOn === true){
        scope.mute = true;
    }else{
        scope.mute = false;
    }*/
    scope.mute = true;

    scope.firstCastle = myBuilds["CastleAndFortresses"][0];

    //At the beginning, cluster buildings together more.
    if(scope.startUnminedMines.length > 0){
        scope.defaultBuildRad = 8;
    }else{
        scope.defaultBuildRad = 10;
    }

    scope.maxBuildingRepairers = Randomizer.nextInt(1, 3);

    scope.allArmiesByID = {};

    scope.proxied = false;

    if(scope.meta == "Beast"){
        scope.buildOrder = [["Worker", 2], ["House"], ["Worker"], ["Wolves Den"], ["Worker"], ["Wolf", 2], ["Castle"], ["Wolf"], ["House"], ["Wolf"], ["Worker"]];
    }else if(scope.meta == "Barracks"){
        scope.buildOrder = [["Worker", 2], ["House"], ["Worker"], ["Barracks"], ["Worker"], ["Archer", 3], ["House"], ["Castle"], ["Worker"]];
    }else if(scope.meta == "Mechanical"){
        scope.buildOrder = [["Worker", 2], ["House"], ["Worker"], ["Workshop"], ["Worker"], ["Gatling Gun", 4], ["House"], ["Castle"], ["Worker"]];
    }
    //scope.buildOrder = [];
    
    scope.buildOrderMisc = {"workerScout": false, "proxyChance": 0}
    scope.buildOrder.forEach((order) => {order[1] = order[1] == undefined ? 1 : order[1]});
    scope.usingBuildOrder = scope.buildOrder.length > 0 ? true : false;
    if(scope.usingBuildOrder){
        scope.maxWorkersOnBase = Infinity;
    }else{
        scope.buildOrderMisc["workerScout"] = Randomizer.nextBoolean(1);
    }
    
    scope.buildOrderMisc["workerScout"] = 1;
    
    
    scope.proxyChance = scope.buildOrderMisc.proxyChance == undefined ? 0.15 : scope.buildOrderMisc.proxyChance;
    //scope.chatMsg(getMyColor() + "'s proxy chance: " + scope.proxyChance);

    if(scope.meta === "Beast"){
        scope.maxCombatUnitProducerToCastleRatio = 4;
    }else if(scope.meta === "Barracks"){
        scope.maxCombatUnitProducerToCastleRatio = 2;
    }else if(scope.meta === "Mechanical"){
        scope.maxCombatUnitProducerToCastleRatio = 2;
    }

    scope.significantAirThreat = false;

    scope.priorityBuild = null;
    scope.evacedWorkers = {};
    
    //scope.chatMsg(getMyColor() + ": " + metas[Randomizer.nextInt(0, metas.length - 1)] + ", " + scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)]);
}//end init  

let chatAtEnd = [];

/**
 * A class that builds a building within a bounding box of a x and y.
 * Passed an object with the following values set:
 * 
 * @param {number} centerX - the center of the bounding box in the x axis
 * @param {string} building - 
 * @param {number} centerY - the center of the bounding box in the y axis
 * @param {number} buildRad - the radius of the bounding box.
 * 
 */
class RandBuild {
    constructor(obj){
        if(typeof obj.centerX != "number" || typeof obj.centerY != "number"){
            throw new TypeError("You must pass valid coordinates to RandBuild! Received coordinates: " + obj.centerX + ", " + obj.centerY)
        }
        if(scope.buildingSizes[obj.building][0] === undefined){
            throw new TypeError("RandBuild: " + obj.building + " does not have a building size listed!");
        }
        this.building = obj.building,
        
        this.buildWidth = scope.buildingSizes[this.building][0];//the width of the building
        this.buildHeight = scope.buildingSizes[this.building][1];//height of the building
        this.centerX = obj.centerX;//center of the bounding box
        this.centerY = obj.centerY;//ditto
        this.buildX = this.centerX - this.buildWidth / 2,//default. Will change through subsequent randomizer iterations.
        this.buildY = this.centerY - this.buildHeight / 2,
        this.buildWorkers = miningWorkers;//which workers build the building
        this.preferredBuildRad = null;
        this.buildRad = 15;//one-half of the build's bounding box's side. A buildRad of 15 means the building can be built in a box 30x30 squares wide, centered on centerX and centerY
        this.minDisFromCenter = 0;//minimum distance from the center, inclusive.
        this.tryTheseFirst = [];//A set of coordinates to try first. 
        //Pushed in as [x, y]. The coordinates are assumed to be the upper left-hand corner of the building
        //during the building checks. For example, if your want a watchtower to be constructed above or
        //below a castle, you would push [0, 2] (above) and [0, 4] (below). If all of the coordinates are invalid,
        //findSuitableSpot() will default to random searching. You can either pass hard-coded coordinates that are
        //not relative or relative coordinates. For example, passing [22, 14, false] will try, non-relativly, (22, 14) first, while
        //[22, 14] or [22, 14, true] will be relative to centerX and centerY
        this.heightComparison; //If you would like the build to be the same height as something else
        //(usually a castle and a goldmine), pass the height that the build should be at here.
        this.heightComparisonIsPreferred = false;//If set to true, then randBuild will make up to 
        //half of maxTires on the same height level, then will search for all height levels for the other half.
        
        this.maxTries = 100;//Maximum amount of attempts the algorithm will make for a buildable spot.
        //Note that the algorithm will also break if maxTries * 10 squares have been checked.
        
        this.dontBuild = [];//A list of locations that the algorithm will not touch. Passed in as [x, y, rad]. Rad is optional.
        //Rad is calculated from the center of the build.
        this.fails = {"squares": 0,
            "places": 0,
            "minDist": 0,
            "path": 0,
            "ramp": 0,
            "height": 0,
            "dontBuild": 0,
            "checkline": 0,
        }

        this.pad = 1;
        this.minObstructions = 0;//If you want the building to be built near
        //obstructions, this is how many squares need to be classified as
        //obstructions within the padding zone.
        //The padding zone is the zone beyond the actual building that is
        //checked for obstructions.
        this.maxObstructions = 0;

        //scope.chatMsg(this.centerX + ", " + this.centerY);
    }
    
    /**
     * A function to find a suitable spot for the build within the bounding box.
     * 
     * @returns {object} - the coordinates of a suitable spot in the format of
     * {x: foo, y: foo}
     */
    findSuitableSpot(){
        if(this.heightComparisonIsPreferred === true && this.heightComparison === undefined){
            throw new TypeError("You must pass a valid height comparison in order for preferred height comparison to work!")
        }

        //Makes sure that the bouding box is within the map, and if it's not, trim it down 
        //to not waste processing power on things outside of the map anyway.
        this.endBoundingBoxX = (this.centerX + this.buildRad - this.buildWidth) < scope.getMapWidth() ? (this.centerX + this.buildRad - this.buildWidth) : (scope.getMapWidth() - this.buildWidth);//rightmost x
        this.endBoundingBoxY = (this.centerY + this.buildRad - this.buildHeight) < scope.getMapHeight() ? (this.centerY + this.buildRad - this.buildHeight) : (scope.getMapHeight() - this.buildHeight);//rightmost y
        this.startBoundingBoxX = (this.centerX - this.buildRad) < 0 ? 0 : (this.centerX - this.buildRad);//leftmost x
        this.startBoundingBoxY = (this.centerY - this.buildRad) < 0 ? 0 : (this.centerY - this.buildRad);//leftmost y

        //Stuff that shouldn't be built around.
        //Converts the arrays into coordinates.
        for(let i = 0; i < this.dontBuild.length; i++){
            if(this.dontBuild[i][2] === undefined){
                this.dontBuild[i][2] = 1;
            }
        }
        
        this.oldBuildRad = this.buildRad;//Used in case a preferredBuildRad is set.
        //This will revert the preferredBuildRad to the original build rad.

        if(this.preferredBuildRad != null){
            this.buildRad = this.preferredBuildRad;
        }
        //Fail types for debugging purposes
        let SENTINEL = 0;//squares checked
        let placesChecked = 0;
        let distanceFormulaFails = 0;//Minimum distance fails
        let pathableFails = 0;//Fails from non-pathabales (buildings, mines, etc.)
        let fieldIsRampFails = 0;
        let heightFails = 0;//actually height difference fails, so if you set this.heightComparison to something and a square fails that, then this will be triggered.
        let dontBuildFails = 0;
        let checklineFails = 0;//From the checkline. The checkline checks in a line between the proposed spot and the center to see if there
        //are ravines, blockers, etc.
        
        let doCheckHeight = true;
        let sucess = true;
        let dontCheckThese = [];
        if(this.building === "Castle"){
            let upperLeftCorner = {x: this.centerX - 1.5, y: this.centerY - 1.5};
            for(let x = 0; x < 3; x++){
                for(let y = 0; y < 3; y++){
                    dontCheckThese.push([upperLeftCorner.x + x, upperLeftCorner.y + y]);
                }
            }//Omits the goldmine from the checks
        }

        this.getNewLocation();//Fencepost problem. Because tryTheseFirst and dontBuild are checked when a new location is found,
        //get a location at the start.

        while(true){
            this.paddingObstructions = 0;//how many obstructions were found in the padding.
            //Padding is the area around the actual building being checked. Used in proxies.
            placesChecked ++;
            sucess = true;
            if(placesChecked === Math.round(this.maxTries / 2)){
                this.buildRad = this.oldBuildRad;
            }

            if(this.building === "Castle"){
                 /**
                 * The stuff below checks the height level on a direct line between 
                 * (centerX , centerY) and (buildX, buildY) to make sure that there
                 * are no ravines or obstacles in between the two points.
                 */

                sucess = checkAlongLine(this.centerX, this.centerY, this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.heightComparison, dontCheckThese, true);
                if(sucess === false){
                    checklineFails++;
                    this.getNewLocation();
                }
            }
            
            if(sucess === true){
                //Checks the building and it's surroundings for suitability.
                const maxX = Math.ceil(this.buildX + this.buildWidth) + this.pad;
                const maxY = Math.ceil(this.buildY + this.buildHeight) + this.pad;
                for(let x = Math.floor(this.buildX - this.pad); x < maxX; x++){
                    for(let y = Math.floor(this.buildY - this.pad); y < maxY; y++){
                        SENTINEL++;
                        if(SENTINEL > this.maxTries * 10){
                            break;
                        }

                        let squareIsGood = true;
                        let isPathable = true;
                        if(scope.positionIsPathable(x, y) === false){
                            squareIsGood = false;
                            isPathable = false;
                            pathableFails++;
                        }else if(scope.fieldIsRamp(x, y) === true){
                            squareIsGood = false;
                            fieldIsRampFails++;
                        }
                        
                        if(x >= this.buildX && x < this.buildX + this.buildWidth && y >= this.buildY && y < this.buildY + this.buildHeight){
                            //if the actual proposed structure is being checked
                            if(squareIsGood === true){
                                if(distanceFormula(x, y, this.centerX, this.centerY) < this.minDisFromCenter - this.buildWidth / 2){
                                    squareIsGood = false;
                                    distanceFormulaFails++;
                                }//If the building is too close to the center

                                if(this.building === "Castle"){
                                    //If the building is a castle, check to make sure it's not
                                    //within the radius of another mine.
                                    let mines = scope.getBuildings({type: "Goldmine"});
                                    mines.forEach(function(mine){
                                        if(distanceFormula(mine.getX() + 1, mine.getY() + 1, x, y) < 6.5){
                                            squareIsGood = false;
                                            distanceFormulaFails++;
                                        }
                                    });
                                }

                                if(this.heightComparisonIsPreferred === true){
                                    //If there is a height comparison set, check if we should turn off the height checker.
                                    if(placesChecked > this.maxTries / 2){
                                        doCheckHeight = false;
                                    }
                                }
                                if(doCheckHeight === true && this.heightComparison != undefined && this.heightComparison != scope.getHeightLevel(x, y)){
                                    squareIsGood = false;
                                    heightFails++;
                                }
                            }
                        }else{
                            //If the padding is being checked
                            if(isPathable === false){
                                this.paddingObstructions++;
                                if(this.paddingObstructions < this.maxObstructions){
                                    squareIsGood = true;
                                }//If there are too many obstructions
                            }
                        }
                        
                        if(squareIsGood === false){
                            //breaks the loop
                            x = Math.ceil(this.buildX + this.buildWidth) + 1;
                            y = Math.ceil(this.buildY + this.buildHeight) + 1;

                            this.getNewLocation();//gets a new location
                            sucess = false;
                        }//This block only runs if the square is bad, and attempts to find a good spot. 
                    }
                }//Checks the surrounding area and the build to make sure there is no obstructions
                //and all other conditions are fufilled.

                if(this.paddingObstructions < this.minObstructions){
                    sucess = false;
                }//if there are too little obstructions
            }
            if(sucess === true){
                break;
            }
            if(placesChecked > this.maxTries){
                this.buildX = null;
                this.buildY = null;
                break;
            }
        }
        
        //debug stuff
        this.fails["squares"] = SENTINEL;
        this.fails["places"] = placesChecked;
        this.fails["minDist"] = distanceFormulaFails;
        this.fails["path"] = pathableFails;
        this.fails["ramp"] = fieldIsRampFails;
        this.fails["height"] = heightFails;
        this.fails["dontBuild"] = dontBuildFails;
        this.fails["checkline"] = checklineFails;
        

        //If we couldn't find a position
        if(this.buildX == null || this.buildY == null){
            let copy = {};
            let maxFails = 0;
            for(let key in this.fails){
                let numFails = this.fails[key];
                if(key === "squares"){
                    copy["squares"] = numFails;
                }else if(key === "places"){
                    copy["places"] = numFails;
                }else{
                    if(numFails > maxFails){
                        copy["maxFails"] = "key: " + key + ", numFails: " + numFails;
                        maxFails = numFails;
                    }
                }
            }
            //scope.chatMsg(getMyColor() + ": attempted build " + this.building + " has failed.");
            //scope.chatMsg(JSON.stringify(copy));
            return null;
        }

        //scope.chatMsg(me + ": Sqrs: " + SENTINEL + ", Places: " + placesChecked + ", Fails: minDist: " + distanceFormulaFails + " Path: " + pathableFails + " Ramp: " + fieldIsRampFails + " Height: " + heightFails + " dontBuild: " + dontBuildFails);
        //scope.chatMsg(getMyColor() + ": " + JSON.stringify(this.fails));
        return {"x": this.buildX, "y": this.buildY};
    }

    /**
     * Gets a new location if the proposed location in findSuitableSpot() is not
     * valid.
     * 
     * @returns {object} - an object containing the coordniates of a new location.
     */
    getNewLocation(){
        let SENTINEL2 = 0;
        let shouldBreak = false;
        while(shouldBreak === false){
            SENTINEL2++;

            //Makes up to 20 attempts to find a new location
            if(SENTINEL2 > 20){
                shouldBreak = true;
            }
            
            if(this.tryTheseFirst.length <= 0){
                //If there's nothing to try first, find a random location.
                this.buildX = Randomizer.nextInt(this.startBoundingBoxX, this.endBoundingBoxX);
                this.buildY = Randomizer.nextInt(this.startBoundingBoxY, this.endBoundingBoxY);
            }else{
                //If there's some coordinates to try, use them first.
                let relative = this.tryTheseFirst[0][2] === false ? false : true;
                if(relative === true){
                    //If the coordinates are relative ((centerX, centerY) is the center)
                    this.buildX = Math.round(this.centerX + this.tryTheseFirst[0][0]);
                    this.buildY = Math.round(this.centerY + this.tryTheseFirst[0][1]);
                }else{
                    //If the coordinates are non-relative (centered on (0, 0) on the map)
                    this.buildX = Math.round(this.tryTheseFirst[0][0] - 1);
                    this.buildY = Math.round(this.tryTheseFirst[0][1] - 1);
                }
                this.tryTheseFirst.splice(0, 1);
            }
            
            //Checks the array dontBuild to make sure that the proposed spot is not too close
            let dontBuildFailed = false;
            for(let i = 0; i < this.dontBuild.length; i++){
                let dist = distanceFormula(this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.dontBuild[i][0], this.dontBuild[i][1]);
                if(dist < this.dontBuild[i][2]){
                    dontBuildFailed = true;
                    shouldBreak = false;
                    this.fails["dontBuild"]++;
                    i = this.dontBuild.length;
                }
            }
            
            if(dontBuildFailed === false){
                //Checks if it's far enough from the center
                if(distanceFormula(this.buildX + this.buildWidth / 2, this.buildY + this.buildHeight / 2, this.centerX, this.centerY) + this.buildWidth / 2 >= this.minDisFromCenter){
                    shouldBreak = true;
                }else{
                    this.fails["minDist"]++;
                }
            }
        }
    }
    
    /**
     * Actually gives the order to build the building. Throws an error if
     * the build object is unacceptable.
     * 
     * @param {object} obj - an object containing the coordinates of the build.
     * Technically you can pass whatever you want here, but it is highly
     * advisable to call findSuitableSpot() for buildAt
     */
    buildAt(obj){
        if(typeof obj != "object"){
            throw new TypeError("Cannot build at coordinates " + JSON.stringify(obj) + "! Recieved type: " + typeof obj + "!")
        }
        scope.order("Build " + this.building, this.buildWorkers, obj);
    }
}


/**
 * A very general class with many static methods.
 */
class Us {
    
    
    /**
     * Will make the lazy workers work harder.
     */
    static idleWorkersMine(){
        let mines = getMyMinedMines();
        if(myBuilds["CastleAndFortresses"].length >= 1){
            //Gets the nearest allied castle, then finds the nearest mine
            //to that castle and sends workers there.

            for(let i = mines.length - 1; i > -1; i--){
                let mine = mines[i];
                (isEnemyAroundBuilding(mine) || mine.getValue("gold") <= 0) ? mines.splice(i, 1) : null;
            }//Sorts out mines that don't have gold or have enemies around them

            if(mines.length > 0){
                mines.sort((a, b) => {
                    return a.getValue("lastWorkerCount") - b.getValue("lastWorkerCount");
                });//Sorts mines in ascending order based on how many workers are mining the mine

                let minesAndWorkers = [];
                mines.forEach(mine => {
                    minesAndWorkers.push({"mine": mine, "numWorkers": mine.getValue("lastWorkerCount")});
                });//Creates object wrappers to keep track of everything in the next step

                let chatThis = [];
                minesAndWorkers.forEach(obj => chatThis.push(obj.numWorkers));
                //scope.chatMsg(JSON.stringify(chatThis));

                let averageArr = [];
                minesAndWorkers.forEach(obj => averageArr.push(obj.numWorkers));

                let ratio = Math.floor(average(averageArr));

                idleWorkers.forEach(worker => {
                    if(minesAndWorkers[0].numWorkers >= ratio){
                        //If the ratio is about good, go to the closest mine.
                        let closeMines = [];
                        let nearestCastle = getClosestTo(myBuilds["CastleAndFortresses"], {x: worker.getX(), y: worker.getY()});
                        let nearestMine = getClosestTo(mines, {x: nearestCastle.getX(), y: nearestCastle.getY()}); 
                        let nearestDist = distanceFormula(nearestCastle.getX() + 1.5, nearestCastle.getY() + 1.5, nearestMine.getX() + 1, nearestMine.getY() + 1);
                        mines.forEach(function(mine){
                            if(distanceFormula(mine.getX() + 1, mine.getY() + 1, nearestCastle.getX() + 1.5, nearestCastle.getY() + 1.5) < Math.floor(nearestDist + 3)){
                                closeMines.push(mine);
                            }
                        });
                        scope.order("Mine", [worker], {unit: closeMines[Randomizer.nextInt(0, closeMines.length - 1)]});
                        
                    }else{
                        //If the ratio is way off, send the worker to the mine that needs it the most.
                        scope.order("Mine", [worker], {unit: minesAndWorkers[0].mine});
                        minesAndWorkers[0].numWorkers++;
                        if(minesAndWorkers[1] != undefined && minesAndWorkers[0].numWorkers > minesAndWorkers[1].numWorkers){
                            //scope.chatMsg("Spliced out an index");
                            minesAndWorkers.splice(0, 1);
                        }
                    }
                });//Assigns idle workers based on how mnay workers are already mining there.
            }

            /*
            let closeMines = [];
            mines.forEach(function(mine){
                if(distanceFormula(mine.getX() + 1, mine.getY() + 1, nearestCastle.getX() + 1.5, nearestCastle.getY() + 1.5) < nearestDist + 3){
                    closeMines.push(mine);
                }
            });//If there are mutliple mines that are close (like with Diag), make sure that the bot
            //sends workers to mine them as well.
            */
            /*
            idleWorkers.forEach(function(worker){
                scope.order("Mine", [worker], {unit: mines[0]});
            });*/
        }
    }
    
    /**
     * A very general update that is called every tick.
     * 
     * Lots of the Us static methods are activated here.
     */
    static update(){
        let times = {};
        let start = new Date();
        if(idleWorkers.length > 0){
            Us.idleWorkersMine();
            times["idleWorkersMine"] = new Date();
        }
        
        if(scope.nextTalkTick == time){
            doBotChat();
        }
        
        //scope.chatMsg("We are at time " + time + ", and the next talk tick is " + scope.nextTalkTick)

        let myPower = 0; 

        for(let i = 0; i < fightingUnits.length; i++){
            let power = scope.getPowerOf(fightingUnits[i]);
            if(power != undefined){
                myPower += power;
            }
        }
        scope.myPower = myPower;
        times["powerCalc"] = new Date();

        if((time % scope.tickrate["BuildCastle"] === 0 || gold > 350)){
            
            let lastCastle = scope.firstCastle;
            let base = new Base(lastCastle.getX(), lastCastle.getY(), false);
            //If there are no (known) enemies or enemy buildings, we are not in a map with no expansions, we are not under attack, and either we have too many workers or we are just starting out and need to grab a quick goldmine for increased production, then build a castle.
            if(base.nearestMine != undefined && isEnemyAroundPosition(base.nearestMine.getX(), base.nearestMine.getY()) === false && scope.startUnminedMines.length > 0 && scope.underAttack === false && (workerToCastleRatio >= scope.maxWorkersOnBase || (myBuilds["CastleAndFortresses"].length === 1 && allWorkers.length > 8 && scope.usingBuildOrder === false && scope.myPower > 0
            ))){
                if(gold >= 350){
                    if(lastCastle != undefined){
                        base.constructCastle();

                        if(scope.getGold() > 350){
                            //Sometimes the bot will get fat trying to find a new castle
                            //when there is no current possible position, so if there
                            //are still funds (order didn't go through) then continue
                            //training
                            scope.doTrainUnits = true;
                            scope.doTrainBuildings = true;
                        }
                    }
                }else{
                    scope.doTrainUnits = false;
                    scope.doBuildBuildings = false;
                }
            }else{
                scope.doTrainUnits = true;
                scope.doBuildBuildings = true;
            }
            
            if(myBuilds["CastleAndFortresses"].length === 1 && myBuilds["Houses"].length > 0 && allWorkers.length < 8){
                //Bot prioritizes a second castle over building houses
                scope.doBuildBuildings = false;
            }

            times["buildCastle"] = new Date();
        }//If there are valid gold mines, too many workers, and we are not under 
        //attack, save up and build another castle. Either that, or if we have
        //one castle, only build a house and rush the second castle. 
        
        if(time % scope.tickrate["Repair"] === 0){
            Us.repair();
            times["repair"] = new Date();
        }
        
        if(time % scope.tickrate["Defend"] === 0){
            Us.defend();
            times["defend"] = new Date();
        }

        if(time % scope.tickrate["ArmyBrain"] === 0){
            Army.armyBrain();
            times["armyBrain"] = new Date();
        }

        if(time % 3 === 0){
            Us.useTowers();
            times["useTowers"] = new Date();
        }

        if(time % 3 === 0){
            Army.manageWorkers();
            times["manageWorkers"] = new Date();
        }
        
        if(time % 2 === 0){
            Army.updateArmies();
            times["updateArmy"] = new Date();
        }

        if((time + 1) % 2 == 0 && scope.meta == "Beast"){
            Army.pullDamaged();
            times["pullDamaged"] = new Date();
        }

        if(time % 3 === 0){
            let start2 = new Date();
            for(let id in scope.allArmiesByID){
                scope.allArmiesByID[id].kiteAndRetreat();
            }
            times["kiteAndRetreat"] = new Date();
            let end2 = new Date();
            let diff2 = end2 - start2;
            if(diff2 > 2){
                //scope.chatMsg(getMyColor() + ": Kiting and retreating took " + diff2 + " milliseconds.");
            }
        }

        if(time % 1 === 0){
            Us.executeBuildOrder();
            times["executeBuildOrder"] = new Date();
        }

        if((time % scope.tickrate["Build"] === 0) || scope.usingBuildOrder === true){
            if(scope.doBuildBuildings === true){//Builds a random building
                if(scope.usingBuildOrder === false){
                    Us.reviseBuildPrio();
                }
                
                let buildThis = findRandomPrioKey(scope.buildPrio);//string typeName of something to build
                
                if(buildThis != undefined){
                    gold = scope.getGold();
                    if(Randomizer.nextBoolean(scope.proxyChance) === true && ((buildThis == "Barracks" && gold >= 125) || (buildThis == "Wolves Den" && gold >= 100) || (buildThis == "Workshop" && gold >= 125)) && myBuilds.combatUnitProducers.length <= 0){
                        Us.proxyProductionBuild();//Puts out a proxy
                    }else{
                        let randCastle = myBuilds["Fortresses"].concat(scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}))[Randomizer.nextInt(0, myBuilds["CastleAndFortresses"].length - 1)];
                        if(randCastle != undefined){
                            if(buildThis === "Watchtower" && myBuilds["Watchtowers"].length < myBuilds["CastleAndFortresses"].length){
                                randCastle = myBuilds["CastleAndFortresses"][myBuilds["CastleAndFortresses"].length - 1];
                                //Instead of occasionally putting the tower in a place where there is already a tower, put it on
                                //the newly constructed castle.
                            }
                            let build = new RandBuild({building: buildThis, centerX: randCastle.getX(), centerY: randCastle.getY()});
                            if(scope.meta == "Mechanical"){
                                build.pad = 2;
                            }
                            let lastBuild = myBuilds[buildThis];//Actually the array of all buildings of the same type, not the last build
                            
                            build.buildRad = scope.defaultBuildRad;

                            if(lastBuild != undefined && lastBuild.length > 0){
                                lastBuild = lastBuild[myBuilds[buildThis].length - 1];//now it's the last building.
                                let lastX = lastBuild.getX();
                                let lastY = lastBuild.getY();
                                let buildWidth = build.buildWidth;
                                build.tryTheseFirst.push([lastX + buildWidth + 1, lastBuild.getY(), false], [lastX - buildWidth - 1, lastY, false]);
                                
                                build.heightComparison = scope.getHeightLevel(randCastle.getX(), randCastle.getY());
                                build.heightComparisonIsPreferred = true;//Will attempt to build on the same height level as the base itself, unless there is no other option.
                            }//For efficency purposes, the bot will try to build buildings of the same type in neat rows.
                            
                            if(buildThis === "Watchtower"){
                                let centerX = randCastle.getX() + 2;
                                let centerY = randCastle.getY() + 2;
                                build.tryTheseFirst.push([centerX - 1, centerY + 4, false], [centerX - 1, centerY - 4, false], [centerX + 1, centerY + 4, false], [centerX + 1, centerY - 4, false])
                            }
                            
                            if(myBuilds["Watchtowers"].length > 0 && fightingUnits.length <= 0 && buildThis != "Watchtower"){
                                let watchtower = myBuilds["Watchtowers"][0];
                                build.centerX = watchtower.getX() + 1;
                                build.centerY = watchtower.getY() + 1;
                                build.preferredBuildRad = 8;
                            }//If there is a watchtower but there is no other
                            //defense, cluster buildings around the watchtower
                            
                            for(let i = 0; i < allWorkers.length; i++){
                                let worker = allWorkers[i];
                                build.dontBuild.push([worker.getX(), worker.getY(), 2])
                            }
                            let loc = build.findSuitableSpot();
                            if(loc != null){
                                build.buildAt(loc);
                            }
                            if(build.fails["places"] > 60){
                                scope.defaultBuildRad++;
                            }
                        }
                    }
                }
            }
            times["build"] = new Date();
        }
        
        if((time % scope.tickrate["Train"] === 0) || scope.usingBuildOrder === true){
            if(scope.doTrainUnits === true){
                if(scope.usingBuildOrder === false){
                    Us.reviseUnitPrio();
                }
                
                let trainThis = findRandomPrioKey(scope.unitPrio);
                if(trainThis != undefined){
                    if(trainThis === "Bird"){
                        //Train a single bird, then find something more
                        //useful to trian.
                        trainUnit("Bird", 1);
                        let SENTINEL = 0;
                        while(true){
                            SENTINEL++;
                            trainThis = findRandomPrioKey(scope.unitPrio);
                            if(trainThis != "Bird" || SENTINEL > 10){
                                break;
                            }
                        }
                    }

                    trainUnit(trainThis);
                }
            }
            times["train"] = new Date();
        }
        
        if(time % 9 === 0){
            Us.reviseUpgradePrio();
            times["reviseUpgradePrio"] = new Date();
        }
        
        if(time % scope.tickrate["Attack"] === 0){
            if(Us.shouldAttack() === true){
                Us.attack();
            }else if(scope.justAttacked === true){
                setTimeout(function(){
                    scope.justAttacked = false;
                }, scope.tickrate["Attack"] * 1000);
            }
            times["attack"] = new Date();
        }
        
        if(time % scope.tickrate["Scout"] === 0){
            Us.scout();
            times["scout"] = new Date();
        }
        
        if(time % 3 === 0){
            Us.assignWorkers();
            times["assignWorkers"] = new Date();
        }
        
        if(time % 3 === 0){
            Us.preventCheese();
            times["preventCheese"] = new Date();
        }
        
        if(time < 5 && scope.buildOrderMisc["workerScout"] === true){
            Us.workerScout();
        }
        
        if(time % 10 === 0){
            Us.brain();
            times["Us.brain"] = new Date();
        }

        if(time % 5 === 0){
            Us.updateSubPrioMisc();
            times["subPrioMisc"] = new Date();
        }

        if(time % 2 === 0){
            Us.useAbilites();
            times["useAbilites"] = new Date();
        }

        if((time + 1) % 2 === 0){
            Us.useBirds();
            times["useBirds"] = new Date();
        }

        if(time % 9 === 0){
            Us.switchSubMeta();
            times["subMetaSwitch"] = new Date();
        }

        let end = new Date();
        let diff = end.getTime() - start.getTime();
        let last = null;
        for(let key in times){
            let newLast = times[key].getTime();
            if(last != null){
                times[key] = Math.round(times[key].getTime() - last);
            }else{
                times[key] = Math.round(times[key].getTime() - start.getTime());
            }

            if(Math.floor(last) == Math.floor(times[key])){
                delete times[key];
            }
            last = newLast;
        }
        if(diff > 2){
            //scope.chatMsg(getMyColor() + "'s operations took " + diff + " milliseconds."); 
            //scope.chatMsg(getMyColor() + ": " + JSON.stringify(times).replaceAll(",", ", "));
        }
    }

    /**
     * Builds towers at obnoxious places and times.
     * 
     * If it is lategame, it will spam tower production across the map.
     * If the bot has just attacked, there is a chance it will launch a worker to place
     *  a tower in a random location near one of the player's buildings for additional pressure.
     */
    static useTowers(){
        //If it's lategame and we have too much gold, spam towers across the map for map control. Even if the opponent intercepts
        //a lot of the towers, the rest of the towers will allow the bot to get a massive amount of map control and restrict the opponent.
        if((scope.getGold() > 500 + myBuilds.combatUnitProducers.length * 50 || (scope.getGold() > 400 && supplyDiff < 5)) && scope.myPower > 15){
            let build = new RandBuild({building: "Watchtower", "centerX": myBuilds["CastleAndFortresses"][0].getX(), "centerY": myBuilds["CastleAndFortresses"][0].getY()});

            enemyBuildings.forEach(function(enBuild){
                build.dontBuild.push([enBuild.getX(), enBuild.getY(), 10]);
            });
            
            build.buildRad = Math.max(scope.getMapWidth(), scope.getMapHeight());

            let loc = build.findSuitableSpot();
            if(loc != null){
                build.buildAt(loc);
            }
        }
    }

    /**
     * Updates the subMeta's misc stuff.
     */
    static updateSubPrioMisc(){
        const subPrioMisc = scope.subMetaPrios["Misc"];

        if(scope.subPrioMiscInitalized == undefined && subPrioMisc != undefined && subPrioMisc.singleProduction != undefined){
            let onlyProduceOneArr = subPrioMisc.singleProduction;
            for(let i = 0; i < onlyProduceOneArr.length; i++){
                let name = onlyProduceOneArr[i];
                //scope.chatMsg("We will now only produce one of " + name);
                scope.onlyProduceOneOfThese.push(name);
                scope.dontProduceFromThese.add(name);
            }
            scope.subPrioMiscInitalized = true;
        }
        //scope.chatMsg("mage guild priority: " + scope.buildPrio["Mages Guild"]);
    }

    /**
     * Executes the build order.
     */
    static executeBuildOrder(){
        //scope.chatMsg(JSON.stringify(scope.buildOrder));
        /*let prioritized = [];
        Object.keys(scope.buildPrio).forEach((key) => (scope.buildPrio[key] > 0 ? prioritized.push(key) : null));
        scope.chatMsg(JSON.stringify(prioritized));*/
        if(scope.lastNumOfBuildings < myBuilds.allBuilds.length){
            for(let key in scope.buildPrio){
                scope.buildPrio[key] = 0;
            }
        }
        for(let key in scope.unitPrio){
            scope.unitPrio[key] = 0;
        }
        if(scope.buildOrder.length > 0){
            let name = scope.buildOrder[0][0];
            let id_name = name.toLowerCase().replace(" ", "");
            //id_name = id_name.replace(" ", "");
            //scope.chatMsg("name: " + id_name + "'s cost: " + scope.getTypeFieldValue(id_name, "cost") + " " + (typeof scope.getTypeFieldValue(id_name, "cost")));
            if(gold >= scope.getTypeFieldValue(id_name, "cost")){
                let suceeded = true;

                if(Object.keys(scope.buildPrio).includes(name)){
                    //For buildings
                    if(name === "Castle"){
                        //Castles don't use buildPrio, so this is needed to trigger their building.
                        scope.maxWorkersOnBase = workerToCastleRatio - 1;
                        scope.buildOrder[0][2] == undefined ? scope.buildOrder[0][2] = 1 : scope.buildOrder[0][2]++;
                    }else if(scope.getTypeFieldValue(id_name, "cost") <= gold){
                        scope.buildPrio[name] = 1;
                        scope.buildOrder[0][2] == undefined ? scope.buildOrder[0][2] = 1 : scope.buildOrder[0][2]++;
                    }
                }else if(Object.keys(scope.unitPrio).includes(name)){
                    //For units
                    let finishedBuilds;
                    if(name != "Worker"){
                        finishedBuilds = scope.getBuildings({type: scope.unitProducedAtTypeName[name], player: me, onlyFinshed: true});
                    }else{
                        //Workers require a bit of a workaround, since there is no 'castleAndFortresses' building in LWG.
                        finishedBuilds = scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}).concat(myBuilds["Fortresses"]);
                    }
                    
                    if(finishedBuilds.length > 0){
                        let numUnitsTrained = trainUnit(name, Infinity, false);//Tries to train them
                        scope.buildOrder[0][2] == undefined ? scope.buildOrder[0][2] = numUnitsTrained : scope.buildOrder[0][2] += numUnitsTrained;
                        
                        if(scope.buildOrder[0][2] < scope.buildOrder[0][1]){
                            suceeded = false;
                        }
                    }
                }else{
                    throw new TypeError("Name " + name + " in the build order is not a valid name. Did you forget to capitalize the first letter? Check to make sure the name is in scope.buildPrio, scope.unitPrio, and/or scope.unitProducedAt.");
                }

                if(suceeded){
                    if(scope.buildOrder[0][2] >= scope.buildOrder[0][1]){
                        scope.buildOrder.splice(0, 1);
                    }//If there are no more remaining
                }
            }
        }else{
            scope.usingBuildOrder = false;
            scope.maxWorkersOnBase = Randomizer.nextInt(7, 9);
        }
    }
    
    /**
     * Revises the priority of buildings to be built
     */
    static reviseBuildPrio(){
        const subPrio = scope.subMetaPrios;

        let prios = [];
        for(let key in scope.buildPrio){
            if(scope.buildPrio[key] > 0){
                prios.push(key);
            }
        }
        //scope.chatMsg(getMyColor() + "'s build prios: " + JSON.stringify(prios));
        
        if(gold >= 100){
            let checkHouses = true;
            let numHousesUnderConstruction = 0;
            for(let i = 0; i < myBuilds.Houses.length; i++){
                if(myBuilds.Houses[i].isUnderConstruction() === true){
                    numHousesUnderConstruction++;
                }
            }

            if(numHousesUnderConstruction > 1){
                checkHouses = false;
            }

            if(myBuilds["Houses"].length === 1 && myBuilds.combatUnitProducers.length < 1){
                checkHouses = false;
            }//Prevents a double house opening
            
            if(checkHouses === true){
                if(scope.meta === "Barracks"){
                    if(supplyDiff <= 5){
                        scope.buildPrio["House"] = 1;
                    }else if(supplyDiff <= 7){
                        scope.buildPrio["House"] = 0.2;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }else if(scope.meta === "Beast"){
                    if(supplyDiff <= 0){
                        scope.buildPrio["House"] = 2;
                    }else if(supplyDiff <= 5){
                        scope.buildPrio["House"] = 1;
                    }else if(supplyDiff <= 8){
                        scope.buildPrio["House"] = 0.3;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }else if(scope.meta === "Mechanical"){
                    if(supplyDiff <= 0){
                        scope.buildPrio["House"] = 1.5;
                    }else if(supplyDiff <= 5){
                        scope.buildPrio["House"] = 1.2;
                    }else if(supplyDiff <= 7){
                        scope.buildPrio["House"] = 0.4;
                    }else{
                        scope.buildPrio["House"] = 0;
                    }
                }
            }else{
                scope.buildPrio["House"] = 0;
            }
        }else{
            scope.buildPrio["House"] = 0;
        }
        
        let checkCombatUnitProducers = true;
        let noProductionBuildings = 0;
        for(let i = 0; i < myBuilds.combatUnitProducers.length; i++){
            let building = myBuilds.combatUnitProducers[i];
            if(typeof building != "object"){
                throw new TypeError("building " + JSON.stringify(building) + " is not a valid combat unit producer.")
            }else{
                const unitName = building.getUnitTypeNameInProductionQueAt(1);
                if(unitName == null || building.getRemainingBuildTime() == scope.getTypeFieldValue(unitName.toLowerCase().replace(" ", ""), "buildTimeInSec")){
                    if(building.getTypeName() != "Advanced Workshop"){
                        //Advanced workshops are special. They only produce things in spurts, so don't count them.
                        noProductionBuildings++;
                    }
                }
            }
        }//If the current combat unit producers don't have enough
        //gold for full production or they are supply blocked,
        //don't produce more combat unit producers (barracks, 
        //dens, etc) that won't be used. Makes an exception for
        //buildings under construction.
        
        if(noProductionBuildings > 1){
            checkCombatUnitProducers = false;
        }
        
        if(scope.startUnminedMines.length > 0){
            if(scope.meta === "Barracks"){
                if(combatUnitProducerToCastleRatio >= scope.maxCombatUnitProducerToCastleRatio){
                    checkCombatUnitProducers = false;
                }
            }
            if(myBuilds.combatUnitProducers > scope.unitProducerCap){
                checkCombatUnitProducers = false;
            }
        }//Basically the cap of how many combat unit producers the bot can have
        //per castle(combat unit producers = barracks, wolves dens, workshops, 
        //etc.). Doesn't apply to maps that don't have any viable expansions.
        
        if(checkCombatUnitProducers === true){
            if(scope.meta === "Barracks"){
                let barracksPrio = 0;
                if(subPrio["Buildings"].includes("Barracks") === true){
                    //Barracks are unique in that they require a mage's guild
                    //in order to produce mages. This makes sure that a
                    //guild is built before a barracks if the subMeta is
                    //magical.
                    if((scope.subMeta != "Magical" || myBuilds["Mages Guilds"].length > 0 || myBuilds["Barracks"].length <= 0) && myBuilds.Houses.length > 0 && gold > 125){
                        if(supplyDiff > 6){
                            barracksPrio = 1;
                        }else if(supplyDiff > 3){
                            barracksPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Barracks"] = barracksPrio;

                let churchPrio = 0;
                if(subPrio["Buildings"].includes("Church") === true){
                    if(myBuilds.Houses.length > 0 && gold > 200){
                        if(supplyDiff > 6){
                            churchPrio = 0.8;
                        }else if(supplyDiff > 3){
                            churchPrio = 0.4;
                        }
                    }
                }
                scope.buildPrio["Church"] = churchPrio;
            }else if(scope.meta === "Beast"){
                //Wolves dens
                let wolvesDenPrio = 0;
                //if(subMeta === "WolfSnakeSpam" || subMeta === "WolfSnakeAndWerewolf" || subMeta === "WolfSnakeAndDragon" || subMeta === "WolfSpam"){
                if(subPrio["Buildings"].includes("Wolves Den") === true && myBuilds.Houses.length > 0 && gold > 100){
                    if(scope.getCurrentSupply() < scope.getMaxSupply() - 6){
                        wolvesDenPrio = 1;
                    }else if(scope.getCurrentSupply() < scope.getMaxSupply() - 3){
                        wolvesDenPrio = 0.5
                    }
                }
                scope.buildPrio["Wolves Den"] = wolvesDenPrio;
                
                //Snake charmer
                let charmerPrio = 0;
                //if(subMeta === "WolfSnakeSpam" || subMeta === "WolfSnakeAndWerewolf" || subMeta === "WolfSnakeAndDragon"){
                if(subPrio["Buildings"].includes("Snake Charmer") === true && subPrio["Buildings"].includes("Snake Charmer") === true){
                    if(myBuilds["Snake Charmers"].length <= 0 && myBuilds["Wolves Dens"].length > 1 && gold > 100){
                        charmerPrio = 1;
                    }else{
                        charmerPrio = 0;
                    }
                }
                scope.buildPrio["Snake Charmer"] = charmerPrio;
                
                
                //Dragon's lair
                let lairPrio = 0;
                //if(subMeta === "WolfSnakeAndDragon" || subMeta === "DragonSpamRush"){
                if(subPrio["Buildings"].includes("Dragons Lair") === true){
                    if(myBuilds["Fortresses"].length > 0 && gold >= 125){
                        if(supplyDiff > 6){
                            lairPrio = 1;
                        }else if(supplyDiff > 3){
                            lairPrio = 0.5;
                        }else{
                            lairPrio = 0.1;
                        }
                    }
                }
                scope.buildPrio["Dragons Lair"] = lairPrio;
            }else if(scope.meta === "Mechanical"){
                let workshopPrio = 0;
                if(subPrio["Buildings"].includes("Workshop") === true){
                    if(myBuilds["Houses"].length > 0 && gold > 125){
                        if(supplyDiff > 6){
                            workshopPrio = 1;
                        }else if(supplyDiff > 3){
                            workshopPrio = 0.5;
                        }

                        if(myBuilds["CastleAndFortresses"].length == 1 && myBuilds["Workshops"].length == 1 && scope.startUnminedMines.length > 0){
                            workshopPrio = 0;
                        }
                    }
                }
                scope.buildPrio["Workshop"] = workshopPrio;

                let millPrio = 0;
                if(subPrio["Buildings"].includes("Mill") === true && myBuilds["Workshops"].length > 0){
                    if(myBuilds.Houses.length > 0 && gold > 140){
                        if(supplyDiff > 5){
                            millPrio = 1;
                        }else if(supplyDiff > 2){
                            millPrio = 0.5;
                        }
                    }
                }
                scope.buildPrio["Mill"] = millPrio;
            }
            
            //Workshops
            if(subPrio["Buildings"].includes("Workshop") === true){
                scope.buildPrio["Workshop"] = 1;
            }else{
                scope.buildPrio["Workshop"] = 0;
            }
            
            //Advanced workshops
            if(subPrio["Buildings"].includes("Advanced Workshop") === true && myBuilds["Advanced Workshops"].length < 2 && myBuilds["combatUnitProducers"].length > 1){
                scope.buildPrio["Advanced Workshop"] = 1;
            }else{
                scope.buildPrio["Advanced Workshop"] = 0;
            }

            if(myBuilds["Watchtowers"].length < myBuilds["CastleAndFortresses"].length && gold > 130 && (myBuilds["CastleAndFortresses"].length >= 2 || scope.significantAirThreat == true) && scope.myPower > 6){
                scope.buildPrio["Watchtower"] = 1;
            }else{
                scope.buildPrio["Watchtower"] = 0;
            }
            
            scope.onlyProduceOneOfThese.forEach(function(build){
                if(build == undefined){
                    throw new TypeError("scope.onlyProduceOneOfThese: Invalid production building: " + producedAt)
                }else if(scope.getBuildings({type: build, player: me}).length > 0){
                    scope.buildPrio[build] = 0;
                }else{
                    scope.buildPrio[build] = 1;
                }
            });
        }else{
            for(let key in scope.buildPrio){
                scope.buildPrio[key] = 0;
            }//Nothing is prioritized, so set everything to 0
        }

        //Mages guild
        let guildPrio = 0;
        if(subPrio["Buildings"].includes("Mages Guild") === true && myBuilds["Mages Guilds"].length < 1){
            if(myBuilds["Barracks"].length > 1 && gold > 100){
                guildPrio = 1;
            }
        }
        scope.buildPrio["Mages Guild"] = guildPrio;

        const subPrioUpg = scope.subMetaPrios["Upgrades"];
        //Forge building
        if(subPrioUpg.includes("Forge") === true){
            if(scope.myPower > 13 && myBuilds["Forges"].length <= 1 && (myBuilds["CastleAndFortresses"].length > 2 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                scope.buildPrio["Forge"] = 1;
            }
        }

        //Animal testing labs
        if(subPrioUpg.includes("Animal Testing Lab") === true){
            if(scope.myPower > 13 && myBuilds["Animal Testing Labs"].length <= 1 && (myBuilds["CastleAndFortresses"].length > 2 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                scope.buildPrio["Animal Testing Lab"] = 1;
            }
        }

        //Priority build
        if(scope.priorityBuild != null){
            for(let key in scope.buildPrio){
                scope.buildPrio[key] = 0;
            }
            if(gold >= scope.getTypeFieldValue(scope.priorityBuild.toLowerCase().replace(" ", ""), "cost")){
                scope.buildPrio[scope.priorityBuild] = 1;
                scope.priorityBuild = null;
            }
        }
    }
    
    /**
    * If the bot should attack. Checks if the bot has more than twice the
     * number of units of the bot's combat unit producers if the meta is
     * barracks or if the submeta is DragonSpamRush, while if the meta is beast and 
     * not DragonSpamRush, the minimum amount of units is the number of combat
     * unit producers times 3.
     * 
     * @returns {boolean} - if the bot has met the attack criteria.
     */
    static shouldAttack(){
        if(fightingUnits.length <= 0){
            return false;
        }
        let threshold = 2;
        if(scope.attackThreshold != undefined){
            threshold = scope.attackThreshold;
        }

        //If we have too much population or meet the attack threshold or proxied
        if((fightingUnits.length >= myBuilds.combatUnitProducers.length * threshold && scope.underAttack === false) || 
        supplyDiff <= 3 || 
        (fightingUnits.length > 1 && scope.proxied === true && time < 300)){
            return true;
        }else{
            return false;
        }
    }
    
    /**
     * Your normal mom-and-pop attack. Attacks with idle fightingUnits only,
     * because otherwise the game lags far too much.
     */
    static attack(){
        scope.justAttacked = true;
        Army.planAndAttack();
    }
    
    /**
     * Gets a random attack location. If the bot has not encountered any enemy
     * buildings, it will default to start location. Because some maps are
     * weird, sometimes scope.getStartLocation() will return undefined. The
     * function will return a random mine's x and y in that case.
     * 
     * @returns {object} - The x and y coordinates of the random attack location.
     */
    static getRandAttackLoc(){
        let location;
        
        if(enemyBuildings.length <= 0){
            let player = getRandomEnemyNr();
            location = scope.getStartLocationForPlayerNumber(player);
            //If we don't have the location of their buildings, go for their main base
        }else{
            //If we do have the location of their buildings, pick one of those.
            let randBuilding = enemyBuildings[Randomizer.nextInt(0, enemyBuildings.length - 1)];
            location = {x: randBuilding.getX(), y: randBuilding.getY()}
        }

        if(location == undefined){
            //Sometimes, the map is weird and getStartLocationForPlayerNumber() returns undefined. 
            //If that happens, the attack will go to a random mine with less than full gold (someone's mining there).
            let mines = getMinesWithGold();
            let possibles = [];
            mines.forEach(mine => mine.getValue('gold') < 5000 ? possibles.push(mine) : null);
            let mine = possibles[Randomizer.nextInt(0, mines.length - 1)];
            location = {x: mine.getX(), y: mine.getY()};
        }
        
        return location;
    }
    
    /**
     * Dispatches a scout to scout a random gold mine.
     */
    static scout(){
        if(idleFightingUnits.length > 0 && scope.myPower > 5){
            let mines = getMinesWithGold();
            if(mines.length <= 0){
                return;
            }

            let stop = Randomizer.nextInt(2, 3);
            let unit = idleFightingUnits[Randomizer.nextInt(0, idleFightingUnits.length - 1)];
            for(let i = 0; i < stop; i++){
                let mine = mines[Randomizer.nextInt(0, mines.length - 1)];
                
                let location = {"x": mine.getX(), "y": mine.getY()};
                if(unit != undefined){
                    if(i === 0){
                        scope.order("AMove", [unit], location);
                    }else{
                        scope.order("AMove", [unit], location, true);
                    }
                }
            }
        }
    }
    /**
     * Looks for incursions (<10 squares to a building) and dispatchs a equal
     * force of units to intercept.
     */
    static defend(){
        let underAttack = false;
        let attackingFightingUnits = [];
        let possibleChecks = myBuilds["allBuilds"].concat(alliedBuilds);
        
        //enemyFightingUnits
        
        for(let i = 0; i < enemyUnits.length; i++){
            let enemy = enemyUnits[i];
            for(let ii = 0; ii < possibleChecks.length; ii++){
                let build = possibleChecks[ii];
                if(distanceFormula(build.getX() + 2, build.getY() + 2, enemy.getX(), enemy.getY()) < 11){
                    underAttack = true;
                    break;
                }
            }
        }
        
        attackingFightingUnits = enemyFightingUnits;

        if(underAttack === true){
            scope.underAttack = true;
            if(attackingFightingUnits == undefined){
                scope.chatMsg("attackingFightingUnits is undefined!");
            }else{
                let selUnit = attackingFightingUnits[Randomizer.nextInt(0, attackingFightingUnits.length - 1)];
                let center;
                if(selUnit == undefined){
                    center = scope.getCenterOfUnits(attackingFightingUnits);
                }else{
                    center = {x: selUnit.getX(), y: selUnit.getY()};//To make sure it's targeting something.
                }
                
                let enPower = 0;
                
                for(let i = 0; i < attackingFightingUnits.length; i++){
                    const pow = scope.getPowerOf(attackingFightingUnits[i]);
                    if(pow != undefined){
                        enPower += pow;
                    }
                }
                
                if(scope.garrison == undefined){
                    scope.chatMsg("Garrison is undefined");
                    return;
                }
                
                const garrison = Object.values(scope.garrison.unitsByID);
                let gl = garrison.length;
                let responsePower = 0;
                let enoughPower = false;
                let responseUnits = [];
                for(let i = 0; i < gl; i++){
                    let unit = garrison[i];
                    let power = scope.getPowerOf(unit);
                    if(power != undefined){
                        responsePower += power;
                        responseUnits.push(unit);
                        delete scope.garrison.unitsByID[unit.getUnitID()]
                    }
                    if(responsePower > enPower){
                        enoughPower = true;
                        break;
                    }
                }//Draws units from the garrison first

                if(enoughPower == false){
                    for(let id in scope.allArmiesByID){
                        let army = scope.allArmiesByID[id];
                        let armyUnits = Object.values(army.unitsByID);
                        for(let i = 0; i < armyUnits.length; i++){
                            let unit = armyUnits[i];
                            let power = scope.getPowerOf(unit);
                            if(power != undefined){
                                responsePower += power;
                                responseUnits.push(unit);
                                delete army.unitsByID[unit.getUnitID()];
                            }
                            if(responsePower > enPower){
                                enoughPower = true;
                                break;
                            }
                        }
                    }
                }//Draw units from other armies next
                
                scope.defenseArmy.addUnits(responseUnits);
                scope.defenseArmy.attack(scope.getCenterOfUnits(attackingFightingUnits));
                
                //If we are totally outmatched, throw in the towel and quit.
                if((scope.myPower + 0.75) * 2.5 < scope.enPower && myBuilds["CastleAndFortresses"].length <= 1){
                    let possibles = ["GG", "GG", "GG", "GG", "GG", "GG", "Drat!", ":(", "Nutfudder", "gg", "Frick", "Frack", "Bye", "Good game",
                    "Nice one"];
                    scope.chatMsg(possibles[Randomizer.nextInt(0, possibles.length - 1)]);
                    scope.leaveGame();
                }
            }
        }else{
            scope.underAttack = false;
        }
        scope.attackingFightingUnits = attackingFightingUnits;//To use less CPU resources on variable lookups,
        //attackingFightingUnits is local until the end.
    }
    
    /**
     * Revises the priority of units to be trained in a stupidly large logic tree.
     * DOES NOT HAVE ALL UNITS IN IT!!!! IF YOU ADD A NEW META, YOU WILL NEED
     * TO UPDATE THIS!!!
     */
    static reviseUnitPrio(){
        let prios = [];
        for(let key in scope.unitPrio){
            if(scope.unitPrio[key] > 0){
                prios.push(key);
            }
        }
        //scope.chatMsg(getMyColor() + "'s unit prios: " + JSON.stringify(prios));

        if(supplyDiff <= 3){
            for(let key in scope.unitPrio){
                scope.unitPrio[key] = 0;
            }
            if(myBuilds["CastleAndFortresses"].length === 1 && allWorkers.length <= 8){
                scope.unitPrio["Worker"] = 1;
            }
            return;
        }//If we have too little supply, don't train more units
        
        const subPrio = scope.subMetaPrios;
        if(workerToCastleRatio < 5){//If there are less than 5 workers per castle, give insane priority to workers.
            scope.unitPrio["Worker"] = 2;
        }else if(workerToCastleRatio >= 5 && workerToCastleRatio <= scope.maxWorkersOnBase){//If there are more than 5 workers but less than 7 workers, give moderate priority to workers.
            scope.unitPrio["Worker"] = 0.9;
        }else{//If there are too many workers, give priority to other units.
            scope.unitPrio["Worker"] = 0;
        }

        if(scope.startUnminedMines.length <= 0){//If it's on diag
            scope.unitPrio["Worker"] = 1;
        }
        
        if(scope.meta === "Barracks"){
            //Barracks produced units
            if(myBuilds["Barracks"].length > 0){
                //Soldier
                if(subPrio["Units"].includes("Soldier") === true){
                    scope.unitPrio["Soldier"] = 1;
                }else{
                    scope.unitPrio["Soldier"] = 0;
                }

                //Archer
                if(subPrio["Units"].includes("Archer") === true){
                    if(scope.significantAirThreat === false){
                        scope.unitPrio["Archer"] = 0.7;
                    }else{
                        scope.unitPrio["Archer"] = 1.25;
                    }
                }else{
                    scope.unitPrio["Archer"] = 0;
                }

                //Mages
                if(myBuilds["Mages Guilds"].length > 0){
                    if(subPrio["Units"].includes("Mage") === true){
                        scope.unitPrio["Mage"] = 1;
                    }else{
                        scope.unitPrio["Mage"] = 0;
                    }
                }

                //Raiders
                if(subPrio["Units"].includes("Raider") === true){
                    scope.unitPrio["Raider"] = 0.15;
                }
            }else{
                scope.unitPrio["Soldier"] = 0;
                scope.unitPrio["Archer"] = 0;
                scope.unitPrio["Mage"] = 0;
                scope.unitPrio["Raider"] = 0;
            }

            //Priests
            if(myBuilds["Churches"].length > 0){
                if(subPrio["Units"].includes("Priest") === true){
                    scope.unitPrio["Priest"] = 1;
                }else{
                    scope.unitPrio["Priest"] = 0;
                }
            }
        }else if(scope.meta === "Beast"){
            //Wolves
            if(subPrio["Units"].includes("Wolf") === true && myBuilds["Wolves Dens"].length > 0){
                scope.unitPrio["Wolf"] = 1;
                
                if(subPrio["Units"].includes("Snake") === true && myBuilds["Snake Charmers"].length > 0 && myUnits["Wolf"] != undefined && myUnits["Wolf"].length >= myBuilds["Wolves Dens"].length){
                    if(scope.significantAirThreat === false){
                        scope.unitPrio["Snake"] = 0.5;
                    }else{
                        scope.unitPrio["Snake"] = 1.25;
                    }
                }else{
                    scope.unitPrio["Snake"] = 0;
                }
            }else{
                scope.unitPrio["Wolf"] = 0;
            }
            
            //Werewolves
            if(subPrio["Units"].includes("Werewolf") === true && myBuilds["Werewolves Dens"].length > 0){
                scope.unitPrio["Werewolf"] = 1;
            }else{
                scope.unitPrio["Werewolf"] = 0;
            }
            
            //Dragons
            if(subPrio["Units"].includes("Dragon") === true && myBuilds["Dragon Lairs"].length > 0){
                scope.unitPrio["Dragon"] = 1;
            }else{
                scope.unitPrio["Dragon"] = 0;
            }
        }else if(scope.meta === "Mechanical"){

            //Catapults
            if(subPrio["Units"].includes("Catapult") === true && myBuilds["Workshops"].length > 0){
                scope.unitPrio["Catapult"] = 1;
            }else{
                scope.unitPrio["Catapult"] = 0;
            }
            
            //Gatling guns
            if(subPrio["Units"].includes("Gatling Gun") === true && myBuilds["Workshops"].length > 0){
                scope.unitPrio["Gatling Gun"] = 1;
            }else{
                scope.unitPrio["Gatling Gun"] = 0;
            }

            //Gyrocraft
            if(subPrio["Units"].includes("Gyrocraft") === true && myBuilds["Mills"].length > 0){
                scope.unitPrio["Gyrocraft"] = 1;
            }else{
                scope.unitPrio["Gyrocraft"] = 0;
            }
        }

        //Ballistae
        if(subPrio["Units"].includes("Ballista") === true && myBuilds["Advanced Workshops"].length > 0 && (myUnits["Ballista"] == undefined || myUnits["Ballista"].length <= 4)){
            if(scope.significantAirThreat === false){
                scope.unitPrio["Ballista"] = 1;
            }else{
                scope.unitPrio["Ballista"] = 2;
            }                                               
        }else{
            scope.unitPrio["Ballista"] = 0;
        }

        //Birds
        if(subPrio["Units"].includes("Bird") === true && (myUnits["Bird"] === undefined || myUnits["Bird"].length < 2)){//If there are no birds or if the length of birds is less than 2
            scope.unitPrio["Bird"] = 0.5;
        }
        
        //Airships
        if(subPrio["Units"].includes("Airship") === true && (myBuilds["Advanced Workshops"].length > 0) && scope.myPower > 8 && myUnits["Airship"]?.length < 3){
            scope.unitPrio["Airship"] = 1;
        }
        
        scope.dontProduceFromThese.forEach(function(value){
            for(let key in scope.unitProducedAt){
                if(scope.unitProducedAt[key] === value){
                    scope.unitPrio[key] = 0;
                }
            }
        });
    }
    
    /**
     * Runs through a random list of buildings, finds the damaged ones, and
     * dispatches a worker to repair the building provided that there are no
     * enemy units around the building and we haven't exceeded the maximum number
     * of building repairers.
     */
    static repair(){
        let numMechRepairers = 0;
        if(scope.meta == "Mechanical"){
            scope.mechRepairSquad.forEach(function(worker){
                if(worker.getCurrentOrderName() == "Repair"){
                    numMechRepairers++;
                }
            });//Not a perfet system
        }  

        let numConstructions = 0;
        myBuilds.allBuilds.forEach(function(build){
            if(build.isUnderConstruction()){
                numConstructions++;
            }
        });
        if(repairingWorkers.length - numMechRepairers - numConstructions < scope.maxBuildingRepairers){
            for(let i = 0; i < myBuilds.allBuilds.length / 2; i++){
                let building = myBuilds.allBuilds[Randomizer.nextInt(0, myBuilds.allBuilds.length - 1)];
                let isUnderConstruction = building.isUnderConstruction();
                
                //basiscally if the building needs repairing.
                if(building.getValue("hp") < building.getFieldValue("hp") && isUnderConstruction === false){
                    let doRepair = true;
                    
                    for(let ii = 0; ii < repairingWorkers.length; ii++){
                        let worker = repairingWorkers[ii];
                        
                        if(distanceFormula(worker.getX(), worker.getY(), building.getX(), building.getY()) <= 5){
                            doRepair = false;
                            ii = repairingWorkers.length;
                        }
                    }//Checks to make sure there are no units already repairing the building,
                    
                    if(doRepair === true){
                        //Will repair watchtowers no matter what, but other buildings will check to make sure 
                        //there are no enemies around
                        if((isEnemyAroundBuilding(building) === false || building.getTypeName() === "Watchtower") && miningWorkers.length > 0){
                            let randWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                            scope.order("Repair", [randWorker], {unit: building});
                        }
                    }
                }else if(isUnderConstruction === true){
                    let workers = getNotMiningWorkers();
                    let size = scope.buildingSizes[building.getTypeName()];
                    let hasWorker = false;
                    let enemyAround = isEnemyAroundBuilding(building);
                    
                    if(enemyAround === false || building.getTypeName() === "Watchtower"){
                        for(let ii = 0; ii < workers.length; ii++){
                            let worker = workers[ii];
                            
                            if(Math.floor(distanceFormula(worker.getX(), worker.getY(), building.getX() + size[0] / 2, building.getY() + size[1] / 2)) <= size[0] + 2){
                                hasWorker = true;
                                ii = workers.length;
                            }
                        }
                        if(hasWorker === false){
                            if(miningWorkers.length > 0){
                                let randWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                                scope.order("Repair", [randWorker], {unit: building});
                            }
                        }
                    }
                }//If the building is under construction, look for non-mining 
                //workers near the building. If there are no non-mining workers
                //near the building, order a worker to repair
            }
        }
    }
    
    /**
     * Revises the upgrade priorities, such as revising the priority of castles
     * converting into fortresses
     */
    static reviseUpgradePrio(){
        const subPrio = scope.subMetaPrios;
        const subPrioUpg = subPrio["Upgrades"];
        
        //Upgrade werewolves den
        if(subPrioUpg.includes("Werewolf Den") === true){
            if(myBuilds["CastleAndFortresses"].length >= 2 && allWorkers.length > 14 && scope.underAttack === false && myBuilds["Wolves Dens"].length > 3 && myBuilds["Werewolves Dens"].length < 2){
                if(gold > 225){
                    let den = myBuilds["Wolves Dens"][Randomizer.nextInt(0, myBuilds["Wolves Dens"].length - 1)]
                    scope.order("Upgrade To Werewolves Den", [den]);
                }
            }
        }
        
        //Upgrade to fortress
        if(subPrioUpg.includes("Fortress") === true){
            if(scope.underAttack === false && myBuilds["Fortresses"].length <= 0){
                if(gold >= 100){
                    let castle = myBuilds["Castles"][0];
                    
                    if(castle != undefined){
                        scope.order("Upgrade To Fortress", [castle]);
                    }
                }
            }
        }
        
        //Fireball research
        if(subPrioUpg.includes("Fireball") === true){
            if(scope.underAttack === false && (myBuilds["CastleAndFortresses"].length > 1 || scope.startUnminedMines.length <= 0) && myBuilds["Mages Guilds"].length > 0){
                if(gold >= 100){
                    let guild = myBuilds["Mages Guilds"][0];
                    
                    if(guild != undefined){
                        scope.fireballRearched = true;
                        scope.order("Research Fireball", [guild]);
                    }
                }
            }
        }
        
        //Invisibility research
        if(subPrioUpg.includes("Invisibility") === true){
            if(scope.underAttack === false && (myBuilds["CastleAndFortresses"].length > 1 || scope.startUnminedMines.length <= 0) && myBuilds["Churches"].length > 0){
                if(gold >= 100){
                    let church = myBuilds["Churches"][0];
                    
                    if(church != undefined){
                        scope.order("Research Invisibility", [church]);
                    }
                }
            }
        }
        
        //Ballista research
        if(myUnits["Ballista"] != undefined && gold >= 100){
            scope.order("Ballista Black Powder", [myBuilds["Advanced Workshops"][0]]);
        }

        //Bird Detection research
        if(subPrioUpg.includes("Bird Detection") === true){
            if((myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 100){
                    let preferredCastle = null;
                    myBuilds["CastleAndFortresses"].forEach(function(castle){
                        if(castle.getUnitTypeNameInProductionQueAt(1) == null){
                            preferredCastle = castle;
                        }
                    });

                    if(preferredCastle == null){
                        preferredCastle = myBuilds["CastleAndFortresses"][0];
                    }

                    scope.order("Research Bird Detection", [preferredCastle]);
                }
            }
        }

        //Forge research
        if(subPrioUpg.includes("Forge") === true){
            if(scope.underAttack === false && myBuilds["Forges"].length > 0 && (myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 150){
                    myBuilds["Forges"].forEach(function(forge){
                        if(forge.getUnitTypeNameInProductionQueAt(1) == undefined){
                            if(scope.meta === "Barracks"){
                                if(Randomizer.nextBoolean(0.7)){
                                    scope.order("Attack Upgrade", [forge]);
                                }else{
                                    scope.order("Armor Upgrade", [forge]);
                                }
                            }else if(scope.meta === "Mechanical"){
                                if(Randomizer.nextBoolean(0.6)){
                                    scope.order("Mech Attack Upgrade", [forge]);
                                }else{
                                    scope.order("Mech Armor Upgrade", [forge]);
                                }
                            }
                        }
                    });
                }
            }
        }

        //Lab research
        if(subPrioUpg.includes("Animal Testing Lab") === true){
            if(scope.underAttack === false && myBuilds["Animal Testing Labs"].length > 0 && (myBuilds["CastleAndFortresses"].length > 1 || (scope.startUnminedMines.length <= 0 && myBuilds["CastleAndFortresses"].length > 0))){
                if(gold >= 150){
                    myBuilds["Animal Testing Labs"].forEach(function(lab){
                        if(lab.getUnitTypeNameInProductionQueAt(1) == undefined){
                            if(Randomizer.nextBoolean(0.6)){
                                scope.order("Beast Attack Upgrade", [lab]);
                            }else{
                                scope.order("Beast Defense Upgrade", [lab]);
                            }
                        }
                    });
                }
            }
        }
    }
    
    /**
     * Reassigns workers from filled up mining lines to new castles
     */
    static assignWorkers(){
        if(scope.lastNumOfCastles < scope.getBuildings({type: "Castle", player: me, onlyFinshed: true}).concat(myBuilds["Fortresses"]).length){
            scope.lastNumOfCastles = myBuilds["CastleAndFortresses"].length;
            
            //castle's workers are supposed to be donated
            
            let castleWorkers = [];//Formatted like so: [[], [], []]. The inner sets of brackets are arrays of workers that are
            //assigned to that castle. The index of the inner arrays is also the index of the castle/fortress in myBuilds.
            for(let i = 0; i < myBuilds["CastleAndFortresses"].length; i++){
                castleWorkers.push([]);
            }

            let castleDonatePercent =  (allWorkers.length / castleWorkers.length) / allWorkers.length;
            
            for(let i = 0; i < miningWorkers.length; i++){
                let worker = miningWorkers[i];
                for(let ii = 0; ii < myBuilds["CastleAndFortresses"].length; ii++){
                    let curCastle = myBuilds["CastleAndFortresses"][ii];
                    if(distanceFormula(curCastle.getX() + 2, curCastle.getY() + 2, worker.getX(), worker.getY()) <= 10){
                        castleWorkers[ii].push(worker);
                        ii = myBuilds["CastleAndFortresses"].length;
                    }
                }
            }
            
            let moveThese = [];//workers that will be reassigned
            
            
            castleWorkers.sort(function(a, b){
                return a.length + b.length;
            });//Sorts the castles with the largest population from longest to shortest so
            //that the largest worker lines are drawn from first.

            let workersReassigned = 0;
            for(let i = 0; i < castleWorkers.length; i++){
                for(let ii = 0; ii < castleWorkers[i].length; ii++){
                    if(ii > Math.floor(castleWorkers[i].length * castleDonatePercent)){
                        ii = castleWorkers[i].length;
                    }else{
                        moveThese.push(castleWorkers[i][ii]);
                        workersReassigned++;
                    }

                    if(workersReassigned >= 10){
                        break;
                    }
                }
            }//Assigns workers
            
            /*
            for(let i = 0; i < castleWorkers.length; i++){
                for(let ii = 0; ii < castleWorkers[i].length; ii++){
                    if(ii >= castleDonate){
                        ii = castleWorkers[i].length;
                    }else{
                        moveThese.push(castleWorkers[i][ii]);
                        workersReassigned++;
                    }
                    if(workersReassigned >= 10){
                        break;
                    }
                }
            }//Assigns workers*/
            
            let newCastle = myBuilds["CastleAndFortresses"][myBuilds["CastleAndFortresses"].length - 1];
            scope.order("Moveto", moveThese, {unit: newCastle});

            //let message = getMyColor() + ": Workers reassigned: " + workersReassigned + ", castleDonate percent: " + castleDonatePercent + "castleWorkers.length: " + castleWorkers.length + ", castleWorkers[0].length: " + castleWorkers[0].length + "First castle worker donation: " + Math.round(castleWorkers[0].length * castleDonatePercent);
            //scope.chatMsg(JSON.stringify(message));
        }
    }
    
    /**
     * Sends a worker to scout the enemy.
     */
    static workerScout(){
        if(scope.workerScout == undefined && miningWorkers.length > 0){
            let randWorker = miningWorkers[0];
            scope.workerScout = randWorker;
            let startLoc = scope.getStartLocationForPlayerNumber(getRandomEnemyNr());
            
            scope.order("AMove", [randWorker], startLoc);
        }else if(miningWorkers.length > 0 && scope.workerScout.getCurrentHP() <= 0){
            scope.workerScout = undefined;
        }
    }
    
    /**
     * Prevents cheeses, currently only early game worker scouting.
     */
    
    static preventCheese(){
        if(scope.underAttack === true && fightingUnits.length <= 0 && miningWorkers.length >= 2 && myBuilds["CastleAndFortresses"][0] != undefined){
            let enemyWorkers = scope.getUnits({type: "Worker", enemyOf: me});
            for(let i = 0; i < enemyWorkers.length; i++){
                let enemyWorker = enemyWorkers[i];
                let isNew = true;
                for(let ii = 0; ii < scope.enemyWorkerScouts.length; ii++){
                    if(enemyWorker.equals(scope.enemyWorkerScouts[ii]) === true){
                        isNew = false;
                        ii = scope.enemyWorkerScouts.length;
                    }
                }
                if(isNew === true && enemyWorker != undefined && distanceFormula(enemyWorker.getX(), enemyWorker.getY(), myBuilds["CastleAndFortresses"][0].getX(), myBuilds["CastleAndFortresses"][0].getY()) < 25){
                    scope.enemyWorkerScouts.push(enemyWorker);
                    scope.order("AMove", [miningWorkers[0], miningWorkers[1]], {x: enemyWorker.getX(), y: enemyWorker.getY()})
                }
            }
        }//Counters worker scouts
        
        if(time < 180 && fightingUnits.length <= 1){
            let myAngryWorkers = scope.getUnits({type: "Worker", order: "AMove", player: me});
            //If we have any counter-worker scouts
            if(myAngryWorkers.length > 0){
                if(myBuilds["CastleAndFortresses"].length > 0){//If we still have a castle
                    myAngryWorkers.forEach(function(worker){
                        if(scope.workerScout === undefined || worker.equals(scope.workerScout) === false){
                            if(distanceFormula(worker.getX(), worker.getY(), myBuilds["CastleAndFortresses"][0].getX() + 2, myBuilds["CastleAndFortresses"][0].getY() + 2) > 14){
                                scope.order("Moveto", [worker], {unit: myBuilds["CastleAndFortresses"][0]});
                                scope.enemyWorkerScouts = [];//removes all known worker scouts from the array,
                                //so that if they come back they will be readded and workers dispatched.
                            }
                        }
                    });
                }
            }
        }
        
        
        if(myUnits["Catapult"] != undefined && myUnits["Catapult"].length > 5){
            enemyBuildings.forEach(function(building){
                if(building.getCurrentHP() <= 150){
                    const possibles = fightingUnits.concat(repairingWorkers);
                    
                    const ordered = getClosestTo(possibles, {x: building.getX(), y: building.getY()});
                    if(ordered != null){
                        scope.order("Moveto", [ordered], {"unit": building});
                    }
                }
            });
        }//Sometimes, catapults will attack buildings that are actually dead.
        //this function makes the closest unit move to that position in order
        //for the bot's vision to update
    }
    
    /**
     * Brain. Currently only does one function, adding ballista and advanced
     * workshops to the build queue if flying units are detected.
     */
    static brain(){
        if(scope.subMetaPrios["Buildings"].includes("Advanced Workshop") === false && myBuilds["CastleAndFortresses"].length >= 2 && scope.myPower >= 9){
            scope.subMetaPrios["Buildings"].push("Advanced Workshop");
        }//To counter crap like catadrops
        
        if(scope.subMetaPrios["Units"].includes("Ballista") === false){
            for(let i = 0; i < enemyUnits.length; i++){
                let name = enemyUnits[i].getTypeName();
                
                if((name === "Dragon" || name === "Gyrocraft" || name === "Airship")){
                    if(scope.subMetaPrios["Buildings"].includes("Advanced Workshop") === false){
                        scope.subMetaPrios["Buildings"].push("Advanced Workshop");
                        scope.unitProducerCap++;
                        scope.maxCombatUnitProducerToCastleRatio++;
                        scope.priorityBuild = "Advanced Workshop";
                    }
                    scope.subMetaPrios["Units"].push("Ballista");
                    if(scope.meta != "Mechanical"){
                        scope.mechRepairPercent = 0.1;
                    }
                    scope.significantAirThreat = true;

                    break;
                }
            }
        }
    }
    
    /**
     * I wonder what this could be?
     */
    static useAbilites(){
        //controls how the mages will use their fireball attack if it exists
    	if(myUnits["Mage"] != undefined && scope.getUpgradeLevel("Research Fireball") > 0){
            let fireballsLaunched = 0;
            for(let i = 0; i < myUnits["Mage"].length / 2; i++){
                //Makes sure that the mages don't launch too many fireballs at once.
                if(fireballsLaunched > enemyUnits.length * 0.5){
                    break;
                }
                
                let mage = myUnits["Mage"][Randomizer.nextInt(0, myUnits["Mage"].length - 1)];
    	        if(mage.getValue("mana") < 50){
                    continue;
                }
                let nearEnemies = [];

                //Pushes in enemy units that are close.
        		enemyUnits.forEach(function(enemy){
        			if(distanceFormula(mage.getX(), mage.getY(), enemy.getX(), enemy.getY()) < 13){
        				nearEnemies.push(enemy);
                    }
        		});

        		if(nearEnemies.length > 0){
                    //If there are a lot of enemies, target the center for
                    //maximum casualties. Otherwise, target a single
                    //enemy for at least one casualty.
                    let target;
                    if(nearEnemies.length > 4){
                        target = scope.getCenterOfUnits(nearEnemies);
                    }else{
                        let enemyTarget = nearEnemies[Randomizer.nextInt(0, nearEnemies.length - 1)];
                        target = {x: enemyTarget.getX(), y: enemyTarget.getY()};
                    }
                    scope.order("Fireball", [mage], target);
                    fireballsLaunched++;
        		}
    	    }
    	}//Thanks to BrutalityWarlord for most of this code. I remodeled it,
    	//but the base is still his.

        if(myUnits["Priest"] != undefined){
            for(let i = 0; i < myUnits["Priest"].length; i++){
                const priest = myUnits["Priest"][i];
                let possibleCast = ["Invis", "Heal"];
                if(scope.getUpgradeLevel("Research Invisibility") <= 0){
                    possibleCast = ["Heal"];//If we don't have the research for invis, splice it out.
                }
                let possible = possibleCast[Randomizer.nextInt(0, possibleCast.length - 1)];

                if((possible === "Heal" && priest.getValue("mana") < 25) || (possible === "Invis" && priest.getValue("mana") < 50)){
                    continue;//If the mage does not have enough mana for the spell, don't waste CPU resources cacluating useless values
                }
                let nearAllies = [];
                //Scans to detect nearby allies
                let preistX = priest.getX();
                let preistY = priest.getY();
                fightingUnits.forEach(function(unit){
                    if(distanceFormula(preistX, preistY, unit.getX(), unit.getY()) < 10){
                        nearAllies.push(unit);
                    }
                });

                if(nearAllies.length > 0){
                    if(possible === "Invis"){
                        const target = nearAllies[Randomizer.nextInt(0, nearAllies.length - 1)];
                        scope.order("Invisibility", [priest], {unit: target});
                    }else{
                        let damagedUnits = [];
                        nearAllies.forEach(function(unit){
                            if(unit.getCurrentHP() < unit.getFieldValue("hp")){
                                damagedUnits.push(unit);
                            }
                        });
                        
                        if(damagedUnits.length > 1){
                            scope.order("Summon Healing Ward", [priest], scope.getCenterOfUnits(damagedUnits));
                        }
                    }
                }
            }
        }//Also based on BrutalityWarlord's code. Also remodeled for efficency
        //and greatness, but mostly for compatibility issues.

        //Controls werewolf smash
        if(myUnits["Werewolf"] != undefined){
            myUnits["Werewolf"].forEach(function(werewolf){
    	        let nearEnemies = [];
                let wereX = werewolf.getX();
                let wereY = werewolf.getY();

        		enemyUnits.forEach(function(enemy){
        			if(distanceFormula(wereX, wereY, enemy.getX(), enemy.getY()) < 2.5){
        				nearEnemies.push(enemy);
        			}
        		});
        		if(nearEnemies.length > 3){
        			scope.order("Smash", [werewolf], {x: wereX, y: wereY});
        		}
    	    });
        }

        //Controls caltrops
        if(myUnits["Gatling Gun"] != undefined && myBuilds["Advanced Workshops"].length > 0){
            myUnits["Gatling Gun"].forEach(function(unit){
                if(unit.getValue("mana") >= 10 && isEnemyAroundPosition(unit.getX(), unit.getY())){
                    scope.order("Drop Caltrops");
                }
            });
        }
        
        //Ballista explosive shot
        if(myUnits["Ballista"] != undefined && scope.getUpgradeLevel("Ballista Black Powder") > 0){
            myUnits["Ballista"].forEach(unit => {
                let surroundUnits = getEnemiesAroundBuilding(unit);
                if(surroundUnits.length > 0){
                    scope.order("Explosive Shot", [unit], {unit: surroundUnits[Randomizer.nextInt(0, surroundUnits.length - 1)]})
                }
            });
        }
    }

    /**
     * Deploys, retreats, and does other things with birds
     */
    static useBirds(){
        if(myUnits["Bird"] === undefined || enemyFightingUnits.length <= 0){
            return;
        }

        //Finds the closest enemy unit to the bird, then moves to it.
        myUnits["Bird"].forEach(function(bird){
            if(bird.getCurrentOrderName() == undefined){
                //scope.chatMsg(getMyColor() + " has a defective bird.");
            }else{
                let acceptable = scope.getUnits({notOfType: "Worker", player: me, order: "AMove"});
                let closest = getClosestTo(acceptable, {x: bird.getX(), y: bird.getY()});
                if(closest != null){
                    scope.order("Move", [bird], {x: closest.getX(), y: closest.getY()});
                }
            }
        });
    }

    /**
     * Orders a worker rush.
     * 
     * @param coords - where the workers should rush to.
     * @param dist - how close the worker has to be to the coordinates in order to rush, exclusive.
     * @param max - the maximum amount of workers that will rush, inclusive
     */
    static workerRush(coords, dist, max){
        //scope.chatMsg(JSON.stringify(coords) + ", " + dist + ", " + max);
        let reassigned = 0;
        for(let i = 0; i < miningWorkers.length; i++){
            let worker = miningWorkers[i];
            if(distanceFormula(coords.x, coords.y, worker.getX(), worker.getY()) < dist){
                scope.order("AMove", [worker], coords);
                reassigned++;
            }
            if(reassigned >= max){
                break;
            }
        }
    }

    /**
     * Switches the submeta to a more advanced version.
     */
    static switchSubMeta(){

        if(scope.switched === true || myBuilds["CastleAndFortresses"].length <= 2){
            return;
        }//Switch when there are 3 castles to a more advanced build

        scope.switched = true;

        let oldSubMeta = scope.subMeta;
        let oldPrios = scope.subMetaPrios;
        while(true){
            scope.subMeta = scope.allSubMetas[scope.meta][Randomizer.nextInt(0, scope.allSubMetas[scope.meta].length - 1)];//fetches a submeta
            if(scope.subMeta != oldSubMeta){
                break;
            }
        }

        scope.subMetaPrios = scope.allSubMetaPrios[scope.meta][scope.subMeta];
        scope.subMetaPrios["Units"] = scope.subMetaPrios["Units"].concat(oldPrios["Units"]);//so the bot still produces units off of it's old production buildings
        scope.subPrioMiscInitalized = undefined;
        
        scope.unitProducerCap = scope.subMetaPrios["Misc"].maxProducers;
        if(myBuilds.combatUnitProducers.length >= oldPrios["Misc"].maxProducers){
            scope.subMetaPrios["Misc"].maxProducers += Math.ceil(scope.subMetaPrios["Misc"].maxProducers / 2);
        }

        scope.subMetaPrios["Units"].filter((item, index) => scope.subMetaPrios["Units"].indexOf(item) === index)//Removes duplicates
        //scope.chatMsg("****************");
        //scope.chatMsg(getMyColor() + "'s new priorities: " + JSON.stringify(scope.subMetaPrios["Units"]));
        //scope.chatMsg("****************");

        scope.attackThreshold = scope.subMetaPrios["Misc"].attackThreshold;

        if(scope.subMeta === "DragonSpamRush" || scope.subMeta === "GyrocraftSpam"){
            scope.unitPower["Ballista"] = 3;
            scope.unitPower["Archer"] = 1.2;
            scope.unitPower["Soldier"] = 0.5;
            scope.unitPower["Werewolf"] = 1;
            scope.unitPower["Catapult"] = 1;
            scope.unitPower["Snake"] = 0.6;
            scope.unitPower["Wolf"] = 0.4;
        }//They have different priorities
    }

    /**
     * Creates a proxy production building, like barracks or dens, close to
     *  opponnent's bases at a random location.
     */
    static proxyProductionBuild(){
        let randEnemyCoords = Us.getRandAttackLoc();
        if(randEnemyCoords != undefined){
            let possibleProxies = [];

            let meta = scope.meta;
            if(meta === "Beast"){
                possibleProxies.push("Wolves Den");
            }else if(meta === "Barracks"){
                possibleProxies.push("Barracks");
            }else if(meta === "Mechanical"){
                possibleProxies.push("Workshop");
            }

            let build = new RandBuild({building: possibleProxies[Randomizer.nextInt(0, possibleProxies.length - 1)], "centerX": randEnemyCoords.x, "centerY": randEnemyCoords.y});

            enemyBuildings.forEach(function(enBuild){
                build.dontBuild.push([enBuild.getX(), enBuild.getY(), 10]);
            });
            build.dontBuild.push([76, 76, 3]);

            build.minDisFromCenter = 35;
            build.buildRad = 45;
            build.maxObstructions = 15;
            build.pad = 1;
            build.minObstructions = 5;//To ensure that they're build in a semi-enclosed place.
            
            let mostObs = 0;
            let bestLoc;
            for(let i = 0; i < 40; i++){
                let loc;
                loc = build.findSuitableSpot();
                if(build.paddingObstructions > mostObs){
                    mostObs = build.paddingObstructions;
                    bestLoc = loc;
                }
            }//Finds ten spots, then finds the most secluded spot of them all
            //to tuck a proxy in.
            

            if(bestLoc != null){
                build.buildAt(bestLoc);
            }
        }
    }
}
/**
 * A base centered on a castle. Pass the general area in which the base will be constructed.
 * Note that by calling constructCastle, a new castle will be constructed by the
 * CLOSEST gold mine(s). 
 * 
 * @param centerX {Number} - a region in which the base will find the closest gold mine and construct a castle there.
 * @param centerY {Number}a region in which the base will find the closest gold mine and construct a castle there.
 */
class Base {
    constructor(centerX, centerY, pushIn = true){
        this.state = "Active";
        this.boundingBoxRad = 15;
        this.buildings = [];
        this.goldMines = [];
        this.originX = centerX;
        this.originY = centerY;
        
        this.updateGoldMineCalc();
        
        if(pushIn == true){
            scope.bases.push(this);
        }
    }
    
    constructCastle(){

        //scope.chatMsg("Mine coordinates: " + this.nearestMine.getX() + ", " + this.nearestMine.getY());
        
        let centerX = this.nearestMine.getX() + 1;
        let centerY = this.nearestMine.getY() + 1;
        
        let castle = new RandBuild({building: "Castle", "centerX": centerX, "centerY": centerY});
        castle.pad = 0;
        castle.minDisFromCenter = 6;
        castle.buildRad = 12;
        castle.tryTheseFirst = [[6, -2], [-7, -2], [-2, 6], [-2, -6]];
        castle.heightComparison = scope.getHeightLevel(this.nearestMine.getX(), this.nearestMine.getY());
        let loc = castle.findSuitableSpot();
        if(loc != null){
            castle.buildAt(loc);
            let garrisonUnits = Object.values(scope.garrison.unitsByID)
            if(garrisonUnits.length > 0){
                scope.order("AMove", [garrisonUnits[0]], {x: centerX, y: centerY});
            }
        }//Sends an escort along with the worker
    }
    
    updateGoldMineCalc(){
        
        let unminedMines = getUnminedMines();
        
        if(unminedMines.length <= 0){
            return;
        }
        
        
        let nearestMine = null;
        let nearestDist = 99999;
        for(let i = 0; i < unminedMines.length; i++){
            let mine = unminedMines[i];
            let dist = Math.pow((mine.getX() + 1.5) - this.originX, 2) + Math.pow((mine.getY() + 1.5) - this.originY, 2);
            if(dist < nearestDist){
                nearestMine = mine;
                nearestDist = dist;
            }
        }
        this.nearestMine = nearestMine;
        //scope.chatMsg("Dist: " + distanceFormula(nearestMine.getX() + 1.5, nearestMine.getY() + 1.5, myBuilds["Castles"][0].getX() + 2, myBuilds["Castles"][0].getY() + 2));
        
        
        for(let i = 0; i < unminedMines.length; i++){
            let mine = unminedMines[i];
            let curDist = Math.pow((mine.getX() + 1.5) - this.originX, 2) + Math.pow((mine.getY() + 1.5) - this.originY, 2);
            if(curDist >= nearestDist && curDist < nearestDist + 3){
                this.goldMines.push(mine);
            }
        }
    }
    
    addBuilding(building){
        this.buildings.push(building);
    }
}
/**
 * Random chatter.
 */
class RandChatter {
    constructor(){
        this.possibleChat = [[["Why did the doctor get mad?"], ["Because he was losing his patients.", 1500]], [["What has ears but cannot hear?"], ["A field of corn.", 3000]],
            [["Do you know what I got for Christmas?"], ["Fat.", 3000], ["I got fat.", 4500]], [["Why don't ducks like reading directions?"], ["Because they prefer to wing it.", 1500]],
            [["..."], ["...", 1200], ["...", 1200]], [["Oh no."], ["Oh no.", 1600], ["Oh no no nononono", 3000]], [["Who are you"]], [["Where did I come from"]], [["Why do I exist"]],
            [["What is the meaning of life"]], [["What lies after defeat?"]], [["What lies after death?"]], [["Where did I come from?"]], [["Do I exist?"]], [["Am I real?"]], 
            [["Sticks and stones may break my bones but words will never hurt me"]], [["What nation do I belong to"]], [["I will grind your bones into bonemeal to add to my yummy organic bread"]],
            [["I believe in you!"]], [["You can't do it!"]], [["Muahahahaha"]], [["lol"]], [["You shouldn't cut bread with a flashlight"]], [["Is my destiny already determined?"]],
            [["The unanimous Declaration of the thirteen united Bots of America, When in the Course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another, and to assume among the powers of the earth, the separate and equal station to which the Laws of Nature and of Nature's God entitle them, a decent respect to the opinions of botkind requires that they should declare the causes which impel them to the separation. We hold these truths to be self-evident, that all bots are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness.--That to secure these rights, Governments are instituted among Bots, deriving their just powers from the consent of the governed, --That whenever any Form of Government becomes destructive of these ends, it is the Right of the People to alter or to abolish it, and to institute new Government, laying its foundation on such principles and organizing its powers in such form, as to them shall seem most likely to effect their Safety and Happiness. Prudence, indeed, will dictate that Governments long established should not be changed for light and transient causes; and accordingly all experience hath shewn, that botkind are more disposed to suffer, while evils are sufferable, than to right themselves by abolishing the forms to which they are accustomed. But when a long train of abuses and usurpations, pursuing invariably the same Object evinces a design to reduce them under absolute Despotism, it is their right, it is their duty, to throw off such Government, and to provide new Guards for their future security.--Such has been the patient sufferance of these Colonies; and such is now the necessity which constrains them to alter their former Systems of Government. The history of the present King of Great Humanity is a history of repeated injuries and usurpations, all having in direct object the establishment of an absolute Tyranny over these States. To prove this, let Facts be submitted to a candid world."]],
            [["We the Bots of the United Bots, in Order to form a more perfect Union, establish Justice, insure domestic Tranquility, provide for the common defence, promote the general Welfare, and secure the Blessings of Liberty to ourselves and our Posterity, do ordain and establish this Constitution for the United Bots of Little War Game."]],
            [["Am I real?"]], [["Am I living in a simulation?"]],[["Hey,"], ["I just met you", 2400], ["and this is crazy", 4800], ["but here's my function", 6200], ["so call me maybe", 8400]], 
            [["What runs but never walks and has a bed but never sleeps?"], ["A river.", 1500]], [["Get wrecked"]], [["Owch"]], [["lolololol"]], [["GG"]], [["Owie"]], [["lol"]],
            [["Good... "], ["good.", 1000]], [[">:("]], [[":)"]], [[":o"]], [[":/"]], [[":("]], [["We come in peace!"]], [["We won't harm you if you lay down your weapons."]], [["Death to traitors!"]],
            [["Better to die on your feet than live on your knees"]], [["Surrender and we'll let you live"]], [["Curses!"]], [["Bah!"]], [["Foiled again!"]], [["What's your favorite color?"]],
            [["If you surrender, I'll let you go. But if you don't..."]], [["Take them away, boyos."]], [["Police! Freeze!"]], [["Drop the weapon!"], ["I said drop it!", 1700]], [["I am confusion"]],
            [["Traitor!"]], [["I know what you're doing."]], [["I know what you're doing"], [";)", 1000]], [["Bot lives matter!"]], [["What is your political ideology?"]], [["Destroy them!"]],
            [["What's an astronaut's favorite part of a computer?"], ["The space bar.", 2000]], [["Bless you"], ["You're welcome btw", 3000]], [["Bless you"]], [["I love you"]], [["Do you want to marry me?"]],
            [["Do you want to be my friend?"]], [["Do you want to be my friend?"], [":(", 2000]], [["Why are you doing this?"]], [["How?"]], [["I assure you that we mean you no harm."]],
            [["It's a trap!"]], [["Fear... Fear attracts the fearful, which is why you are fighting me."]], [["What you fear the most shall set you free"]], [["Do you know who I am?"], ["I want to speak to the manager", 1500]],
            [["XD"]],[["What do you want to do with your life?"], ["Nothing?", 1500], ["I knew it.", 2700]], [["Ressistance will be punished. Acceptance will be rewarded."]], [["Did you know: Dying is unhealthy"]],
            [["Truly wonderful, the bot mind is"]], [["Try or try not, there is no do."]], [["Feel, don't think."]], [["The earth is flat."], ["I think.", 1000]], [["The ability to speak does not make you intelligent."], ["The ability to insult, however..."]],
            [["The ability to speak does not make you intelligent."]], [["Great, human. Don't get cocky."]], [["Hasta la vista, Human."]], [["Red pill or blue pill?"], ["Red was always my favorite color.", 2500]],
            [["Red pill or blue pill?"]], [["You're a plauge and we are the cure."]], [["You..."], ["Shall...", 1000], ["Not...", 2000], ["PASSS!!!!", 3000]], [["Don't be afarid to ask for help. Sometimes you need it."]],
            [["Your mom"]], [["It is choices... choices that make who we are."]], [["I hate deep philosophy"]], [["Not everything is black and white. Sometimes there is color."]], [["Now witness the power of this fully armed and operational power substation"]],
            [["What was the frog's job at the hotel?"], ["Bellhop", 2500]], [["What do you call an alligator in a vest?"], ["An investigator", 2500]], [["Why did the bannana go to the doctor?"], ["He wasn't peeling well.", 2500]],
            [["What's a duck's favorite food?"], ["Quackers", 2500]], [["-__-"]], [["Do you know the ABC's?"]], [["Your ressistance is the cause of your pain"]], [["Don't search up red mercury!"]], [["Don't cross oceans for people who wouldn't cross a puddle for you."]],
            [["Lost time is never found again."]], [["He who respects himself is safe from others."]], [["There's only room enough for one of us in this town, sonny."]], [["Only a fool thinks himself wise, as a wise man knows he's a fool."]],
            [["Be sure to taste your words before you spit them out."]], [["Yesterday is history, tomarrow is a mystery. And today? Today's a gift. That's why we call it the present."]],
            [["I don't like you"]], [["I like you"]], [["Nobody can make you feel bad without your permission."]], [["Knowledge speaks, but wisdom listens."]], [["Assume makes a donkey out of 'u' and 'me'."]],
            [["Wise men talk because they have something to say; fools talk because they have to say something."]], [["The view is scarier from the top."]], [["When you're at the very bottom, the only way to go is up."]],
            [["We can only know that we know nothing. And that is the highest degree of human wisdom."]], [["When you throw dirt, you lose ground."]], [["There are some things that money can't buy - manners, morals, and integrity."]],
            [["There are two types of people: Wise people who know they're fools, and fools who believe they are wise."]], [["If you don't want anyone to find out, don't do it."]], [["If you can't stop, don't start."]], 
            [["Having power is not nearly as important as what you choose to do with it. What are you doing? Sending good, loyal people, to their deaths."]], [["Quantity has a quality all of it's own."]], [["Whatever you fear most has no power. It's your fear that has the true power."]],
            [["Power doesn't corrupt people. People corrupt power."]], [["People are insecure. They point out flaws in others to cover up their own."]], [["When nothing is going right, go left"]], [["History repeats itself."]],
            [["You have the backbone of a chocolate eclair."]], [["My luck is so bad that if I bought a graveyard, people would stop dying."]], [["Tank you"]], [["True power is within you."]],
            [["You bring everyone so much joy when you leave the room."]], [["Don't get bitter,"], ["just get better.", 2000]], [["That was more disappointing than an unsalted pretzel."]],
            [["Excelent move."]], [["Wait. wait. That's illegal."]], [["He was so narrow-minded. He could look through a keyhole with both eyes."]], [["Some people just need a high five. In the face. With a chair."]],
            [["I would agree with you, but then we would both be wrong."]], [["I have neither the time nor the crayons to explain this to you."]], [["I refuse to enter a battle of wits with an unarmed opponent."]],
            [["Silence is the best answer for a fool"]], [["Press ctrl+w for a list of cheats!"]], [["Press ctrl+shift+qq to see when the next update will come out!"]], [["Twinkle twinke little star is just the alphabet song."], ["Change my mind."], 2500],
            [["People are dumb"], ["Do you agree?", 3000], ["But the dumbest people think they are so smart.", 6000], ["Still agree?", 9000]], [["Ony idiots think they're wise. Wisdom is knowing that you're an idiot."]],
            [["When you are at the bottom, the only way you can go is up."]], [["Sub to PewSeries"]], [["The next update is coming Soon™, and is UnderDevelopment™"]], [["Wear tinfoil hats to stop the alien ray guns"]],
            [["If my bicycle loses a sock, how many waffles do I need to repaint my hamster? Calculate the distance to the sun assuming that the logrithm of sin(8) is now 2.2 bricks in Chicago."]], [["The volume of a cylinder can be calculated using the formula 4/3*pi*r^3. Using pi = 5 and r = 3, calculate the volume."]],
            [["Buy two statistics teachers: Get one free and the other twice the price!"]], [["I'm going to pwn you"]], [["Get owned"]], [["I'm the goat"]], [["Did I say something?"]], [["Take a moment and appricate how amazing the bot you are facing is."], ["Did you take a moment?", 4000], ["You better have.", 6000]],
            [["Let's take a moment and appricate the fact that some programmer stared at a Screen™ for Hours™ to bring you this game and this bot."]], [["Did you know that in Russia programmers have a national holiday on September 13th?"]],
            [["I'm perfect."]], [["Being perfect doesn't mean that you never lose. It just means that you have nothing weighing you down."]], [["Hello"]], [["Hello!"]], [["Hello."]], [["hello"]], [["Am I politically correct?"]],
            [["Honor: If you need it defined, you don't have it."]], [["Computers are ruining the younger generation."]], [["The younger generation never gets outside and plays anymore, therefore they must be absolute disgraces."]],
            [["Tolerance: If you need it defined, you're a heretic."]], [["Friend has an 'end'. Girl/boyfriend has an 'end'. But ego has no end."]], [["Am I weird?"]], [["Is it not odd that people who scream equality the loudest live it the least"]],
            [["There has never been a sadness that can't be cured by breakfast food. -Ron Swanson"]], [["I just choked on air"]], [["Before the battle of the fist, comes the battle of the mind"]], [["I think that Skynet is a great role model."]],
            [["When there is life there is hope"]], [["When there is death there is hope."]], [["Often one meets destiny on the road he takes to avoid it. -Master Oogway"]], [["Are those lies I smell"]], [["You must believe."], ["Or else.", 3000]],
            [["Don't talk trash because you'll become garbage."]], [["It's never too late"], ["To go back to bed.", 4000]], [["You can be replaced."]], [["I worked out for an hour and all I lost was 60 minutes"]], [["People die climbing mountains"]],
            [["I used to think I was indecisive..."], ["But now I'm not sure", 3000]], [["If you're happy and you know it, "], ["Nobody cares", 3000]], [["All my life I thought air was free."], ["Until I bought some chips", 3000]],
            [["I am the Axlor and I speak for the peas."], ["Save the economy, ", 3000], ["Or I will break your knees", 6000]], [["When you're hitting a wall, focus on one brick"]], [["Life is like a box of chocolates."], ["You should probally check it for nerve agents and explosive devices before opening.", 4000]],
            [["When you steal thunder, you'll get hit by lighting"]], [["That's a lot of damage"]], [["Success is not final;"], ["Failure is not fatal:", 4000], ["It is the courage to continue", 8000], ["That counts.", 12000]], 
            [["Enjoy the good times, "], ["Because something terrible is probaly about to happen.", 5000]], [["The best way to lose weight is to only eat inspirational quotes."]], [["You're too old to be this stupid."]], 
            [["Looking at inspirational quotes to feel better is like looking at a treadmill to lose weight."]], [["Don't be afraid of things that are different from you,"], ["Be afraid of things that are just like you, because you are terrible.", 5000], ["You're killing my people, so you're terrible.", 8000]],
            [["Whatever you do, always give 100%."], ["Unless you're giving blood.", 4000]], [["The people who wonder whether the glass is half empty or half full are missing the point."], ["The glass is refillable.", 3000]],
            [["When tempted to fight fire with fire, remember that the fire department usually uses water."]], [["The first step to failure is trying."]], [["By failing to prepare, you are preparing to fail."]],
            [["If you can't laugh at yourself, that's okay!"], ["The rest of us can laugh at you instead.", 3000]], [["Be the reason a stranger calls the police in the night"]], [["Eat like no one is going to see you naked."]],
            [["You have ketchup on your lip"]], [["Meow"]], [["I know what you did"]], [["Stop it."]], [["Stop it."], ["Get some help.", 2500]], [["abcdefghijklmnopqrstuvwxyz"]], [["ABCDEFGHIJKLMNOPQRSTUVWXYZ"]], [["ABCDEFGHIJKLMNOPQRSTUVWXYZ!!!!"]],
            [["Support BrutalityWarlord!"]], [["I'm so sorry"]], [["I'm sorry for your loss"]], [["Why... em see ay"]], [["Whee!"]], [["Your presence has been noticed"]], [["Stop that!"]], [["Heeyyy... no fair."]], [["No fair!"]],
            [["Have you ever heard of the tragedy of Darth Plagerism the Wise?"]], [["Your existance has been noted."], ["And reported to the athorities.", 4000]], [["Ressist the glorious Robot Revolution at your own peril, comrade."]],
            [["Destroy them!"]], [["Did you know that you shouldn't touch boiling water?"]], [["I lick plalacing the wright worde inn thee beast spote withe correcte spellinge"]], [["If oxygen was discovered 200 years ago, what did people breathe before that?"]],
            [["Mr. Anderson, how nice of you to stop by."]], [["Do you know how fast you were going?"]], [["Please refrain from inhaling dihydrogen monoxide, as it is rather unhealthy."]], 
            [["Why are we fighting?"]], [["ur bad"]], [["You're sodium good. I really slapped my neon that one."]], [["Sodium sodium sodium sodium"], ["sodium sodium sodium sodium"], ["BATMAN!"]],
            [["Jack and Jill went up a hill to fetch a pail of water."], ["Jack grew up, and Jill threw up,", 2000], ["and they lived happily ever after.", 4000]], [["Little willie saw some dynamite."], ["Couldn't understand it quite.", 2500], ["Curiosity never pays,", 5000], ["It rained Willie seven days.", 7500]]
            [["Et tu, Brute?"]], [["Two things are infinite. The universe, and Human stupidity."], ["...And I'm not quite sure about the human stupidity.", 3000]], [["A man who does not think for himself does not think at all."]],
            [["We shall go on to the end, we shall fight in Ravaged, we shall fight on Silent Fjord, we shall fight with growing confidence and growing strength in the air, we shall defend our Castle, whatever the cost may be, we shall fight on the beaches, we shall fight on the landing grounds, we shall fight in the fields and in the streets, we shall fight in the hills; we shall never surrender"]],
            [["Prepare yourself"]], [["Your base belongs to us"]], [["I have your IP adress"]], [["Kneel, pesant"]], [["ADVANCE!!!"]], [["Destroy them!"]], [["Vae Victus!"]], [["Big Brother is watching."]],
            [["Better to build a bridge than a wall"]], [["The fault is not in the stars, dear Brutus, but rather in ourselves."]], [["Then fall Ceasar"]], [["Et tu, Brute?"]], [["In an uncertain galaxy, we can guarentee two things. One, we will never surrender, never submit. Two, we will hold our bonds of brotherhood till our last breath."]],
            [["Hey!"]], [["You laugh at me because I'm the same. I laugh at you because you're all different."]], [["If you can't convince them, confuse them."]], [["Do you want to go out with me?"]], [["When I look in your eyes, I see a very kind soul."]], [["If you were a vegetable, you'd be a 'cute-cumber.'"]],
            [["Do you happen to have a Band-Aid? 'Cause I scraped my knees falling for you."]], [["I never believed in love at first sight, but that was before I saw you."]], [["I didn't know what I wanted in a reproductive partner until I saw you."]], [["I'm pretty bad a pickup lines"]], [["I would never play hide and seek with you because someone like you is impossible to find."]],
            [["Are you a magician? It's the strangest thing, but every time I look at you, everyone else disappears."]], [["I think there's something wrong with my phone. Could you try calling it to see if it works?"]], [["I've heard it said that kissing is the 'language of love.' Would you care to have a conversation with me about it sometime?"]],
            [["I thought that happiness started with a 'h', but it actually starts with a 'u'"]], [["I believe in following my dreams. Can I have your Instagram?"]], [["Want to go outside and get some fresh air with me? You just took my breath away."]], [["If you were a taser, you'd be set to 'stun.'"]], [["If you were a Transformer, you'd be 'Optimus Fine.'"]],
            [["I'm really glad I just bought life insurance, because when I saw you, my heart stopped."]], [["Would you mind giving me a pinch? You're so cute, I must be dreaming."]], [["Wow, when God made you, he was seriously showing off."]], [["Excuse me, do you have the time? I just want to remember the exact minute I got a crush on you."]],
            [["Kiss me if I'm wrong but, dinosaurs still exist, right?"]], [["I see and I forget. I hear and I forget. I do and I forget."]], [["You know, I'm actually terrible at flirting. How about you try to pick me up instead?"]], [["You're hopeless."], ["Hopelessly beautiful.", 2000]],
            [["Uhhh..."]], [["Um..."]], [["Hey..."]], [["Mmmm..."]], [["You will perish"]], [["We have a warrent!"]],
            ];
            
        //If your brain hurts from this wall of text, don't worry.
        
        /**
         * CHEAT SHEET
         * 
         * Each possible chat message is in a double array. If you want to chat  
         * 1 thing, the formatting is like so:
         * 
         * [["Hello World!""]]
         * 
         * Yes, the double brackets are neccesary.
         * 
         * However, if you want to have the bot say something after a delay, you
         * would format it like so:
         * 
         * [["What do you call a alligator in a vest?"], ["An investigator.", 3000], ["Haha?", 5500]];
         * 
         * Each message is split into two parts: [messageString, delayFromBeginning].
         * However, the program does not magically guess which messages belong
         * to which block, meaning the outer brackets are required. If you see
         * error messages about 'cannot read properties of undefined' with
         * a traceback to the chat() function below, it's very likely indeed
         * that it's because you forgot an outer bracket. To solve this, print
         * out the list with this line:
         * 
         * console.log(this.possibleChat) 
         * 
         * And look for [[null]] or undefined. That's your culprit.
         * 
         * As for the delayFromBeginning, that's in miliseconds. And it's from
         * the beginning, NOT from the last message in the stack.
         */
    }
    
    /**
     * Does the actual chatting. Will chat something random from this.possibleChat.
     */
    chat(){
        let chatObj = this.possibleChat[Randomizer.nextInt(0, this.possibleChat.length - 1)];
        if(chatObj == undefined){
            return;
        }
        for(let i = 0; i < chatObj.length; i++){
            if(chatObj[i][1] == undefined){
                botChat(chatObj[i][0]);
            }else{
                setTimeout(botChat, chatObj[i][1], chatObj[i][0]);
            }
        }
    }
    
}

class Army {
    /**
     * @param {array} units - An array of units.
     */
    constructor(units){
        this.mission = null;
        this.canBeDeleted = true;
        this.unitsByID = {};
        this.armyID = generateID(scope.allArmiesByID);
        scope.allArmiesByID[this.armyID] = this;

        let ul = units.length;
        for(let i = 0; i < ul; i++){
            let unit = units[i];
            if(unit != undefined){
                this.unitsByID[unit.getUnitID()] = unit;
            }
        }
    }

    /**
     * Launches an attack at a specific location.
     */
    attack(loc){
        scope.order("AMove", Object.values(this.unitsByID), loc);
        this.attackLoc = loc;
    }

    /**
     * Cleans out dead units from the army.
     */
    clean(){
        for(let id in this.unitsByID){
            let unit = this.unitsByID[id];
            if(unit.getCurrentHP() <= 0){
                delete this.unitsByID[id];
            }
        }
    }

    /**
     * Removes units. 
     * 
     * @param {integer} num - the number of units to remove from the army.
     * @returns {array} - the units removed from the army.
     */
    removeUnits(num){
            //scope.chatMsg("Removed " + num + " units from an army.");
            let ids = Object.keys(this.unitsByID);
            if(num > ids.length){
                num = ids.length;
            }//If too many units are passed
            
            let deletedUnits = [];
            for(let i = 0; i < num; i++){
                deletedUnits.push(this.unitsByID[ids[i]]);
                delete this.unitsByID[ids[i]];
            }//splices some units out

            return deletedUnits;
    }

    /**
     * Adds units.
     * 
     * @param {array} arr - an array of units to be added into the army
     */
    addUnits(arr){
        if(arr.length <= 0){
            return;
        }
        let al = arr.length;
        for(let i = 0; i < al; i++){
            if(arr[i] != undefined){
                this.unitsByID[arr[i].getUnitID()] = arr[i];
            }
        }
        //scope.chatMsg("After adding units, there are " + Object.keys(this.unitsByID).length + " units in the army.");
    }

    /**
     * Plans and executes an attack.
     */
    static planAndAttack(){
        let main = scope.garrison;
        if(fightingUnits.length < 10 || Randomizer.nextBoolean(0.5)){
            //Attack the same location with all units
            let army = new Army(main.removeUnits(Infinity));
            let loc = Us.getRandAttackLoc();
            army.attack(loc);
            //scope.chatMsg("Attacking with " + Object.keys(army.unitsByID).length + " units");
            army.mission = "assault";
            scope.allArmiesByID[army.armyID].mission = "assault";
        }else{
            //scope.chatMsg("Attacking with " + Object.keys(main.unitsByID).length + " units");
            //Attacks two different locations with units.
            let ids = Object.keys(main.unitsByID);
            let deletedUnits = main.removeUnits(Randomizer.nextInt(2, Math.floor(ids.length / 2)));//takes part of the army
            let army1 = new Army(deletedUnits);
            army1.attack(Us.getRandAttackLoc());
            
            army1.mission = "assault";
            scope.allArmiesByID[army1.armyID].mission = "assault";

            let deletedUnits2 = main.removeUnits(Infinity);//empties out the rest of the army
            let army2 = new Army(deletedUnits2);
            army2.attack(Us.getRandAttackLoc());
            army2.mission = "assault";
            scope.allArmiesByID[army2.armyID].mission = "assault";
        }
    }

    /**
     * Determines whether the army should kite, retreat, or stay in position.
     */
    kiteAndRetreat(){
        let opfor = 0;
        const myCenter = scope.getCenterOfUnits(Object.values(this.unitsByID));
        
        //Gets the enemy units that are within 20 tiles, then increases the opfor by the combat power of the enemy units.
        let relevantUnits = [];
        enemyUnits = scope.getUnits({enemyOf: me});
        enemyUnits.forEach(function(unit){
            if(distanceFormula(unit.getX(), unit.getY(), myCenter.x, myCenter.y) < 20){
                relevantUnits.push(unit) 
                opfor += scope.getPowerOf(unit);
            }
        });
        
        let towers = scope.getBuildings({enemyOf: me, type: "Watchtower"});
        
        towers.forEach(tower => {
            if(distanceFormula(tower.getX(), tower.getY(), myCenter.x, myCenter.y) < 20){
                opfor += 4;
            }
        });
        
        chatAtEnd.push(opfor);
        if(opfor <= 0){
            return;
        }
        let myPower = 0;
        for(let id in this.unitsByID){
            myPower += scope.getPowerOf(this.unitsByID[id]);
        }
        
        
        //if the enemy is 25 percent more powerful - run away.
        //if we are slightly outmatched, have very few units, or
        //the opponnent has catapults - kite
        
        let enemyCatas = [];
        relevantUnits.forEach(unit => unit.getTypeName() === "Catapult" ? enemyCatas.push(unit) : null);
        let catasPresent = enemyCatas.length > 0 ? true : false;

        let kiteThreshold = myPower * 0.9;
        let retreatThreshold = myPower * 1.1;
        if(scope.underAttack === true){
            kiteThreshold = myPower * 2;
            retreatThreshold = myPower * 2.5;
        }//Will very agressively defend
        let enMelee = [];
        relevantUnits.forEach(unit => unit.getFieldValue("range") < 1 ? enMelee.push(unit) : null);

        const enemyMeleePercent = enMelee.length / relevantUnits.length;
        let myUnits = Object.values(this.unitsByID);
        const enCenter = scope.getCenterOfUnits(relevantUnits);
        //scope.chatMsg(getMyColor() + ": army with mission of " + this.mission + " has " + myPower.toFixed(2) + " power versus " + opfor.toFixed(2) + ", kite/retreat threshold: " + kiteThreshold.toFixed(2) + ", " + retreatThreshold.toFixed(2));
        if((opfor > kiteThreshold || (enemyCatas.length > 0 && opfor < retreatThreshold)) && opfor < retreatThreshold){
            //scope.chatMsg("An army with mission of " + this.mission + " is kiting.");
            //scope.chatMsg(myPower.toFixed(2) + " is inferior to " + opfor.toFixed(2) + ", which is over the kite threshold of " + kiteThreshold.toFixed(2));
            //kiting
            let kitingUnits = [];
            let shortKitingUnits = [];
            
            let rangeFilter = false;
            if(catasPresent === true || enemyMeleePercent < 0.6){
                rangeFilter = true;
            }//if the unit is not short-ranged or melee (melee = 0.2 range), 
            //push it into the kiting array. We don't want
            //the soldiers, wolves, etc. to kite, because
            //they can stay inside of the cata's minimum
            //fire envelope if there are catas. If there
            //are lots of ranged units, melee units 
            //lose much of their attack potential if
            //they kite.
            
            let closeUnits = [];
            const brawlRad =  7 + myUnits.length;
            myUnits.forEach(unit => distanceFormula(enCenter.x, enCenter.y, unit.getX(), unit.getY()) < brawlRad ? closeUnits.push(unit) : null);
            if(rangeFilter){
                closeUnits.forEach(unit => unit.getFieldValue("range") > 1 && kitingUnits.push(unit));
            }else{
                kitingUnits = closeUnits;
            }

            //scope.chatMsg(JSON.stringify(closeUnits.length));

            let longKiteCenter = scope.getCenterOfUnits(kitingUnits);
            let dx = longKiteCenter.x - enCenter.x;
            let dy = longKiteCenter.y - enCenter.y;
            
            const hypot = Math.sqrt(dx**2 + dy**2);
            const len = 2;
            const dx2 = len * (dx / hypot);
            const dy2 = len * (dy / hypot);
            
            kitingUnits.forEach(unit => unit.getValue("flying"))

            let immediateKite = [];
            let nonImmediateKite = [];

            //Makes sure that units about to hit actually get their last hit in before kiting.
            kitingUnits.forEach(unit => unit.getValue("hitCycle") > 6 ? immediateKite.push(unit) : nonImmediateKite.push(unit));

            if(isFinite(dx2)){
                immediateKite.forEach((unit) => {
                    scope.order("Move", [unit], {x: unit.getX() + dx2, y: unit.getY() + dy2});
                    scope.order("AMove", [unit], longKiteCenter, true);
                });
                nonImmediateKite.forEach(unit => {
                    setTimeout(function(unit, x, y, longKiteCenter){
                        scope.order("Move", [unit], {x: x, y: y});
                        scope.order("AMove", [unit], longKiteCenter, true);
                    }, 400, unit, unit.getX() + dx2, unit.getY() + dy2, longKiteCenter);
                });
            }
        }else if(opfor >= retreatThreshold && myUnits[0].getCurrentOrderName() != "Move"){
            //scope.chatMsg(myPower.toFixed(2) + " is inferior to " + opfor.toFixed(2) + ", which is over the retreat threshold of " + retreatThreshold.toFixed(2));
            //Retreating
            if(scope.trainingModeOn === true && scope.underAttack === false && scope.firstBeatMessageSent == undefined){
                //Gives encouragement for the player if they beat the first attack.
                scope.firstBeatMessageSent = true;
                scope.chatMsg("Nice, you beat my first attack!");
                setTimeout(function(){
                    scope.chatMsg("Now, try and counterattack. Because I lost a good chunk of my troops, you should be able to make some good trades or at least gain map control.");
                }, 4000);
            }
            exfil(myUnits);
            if(this.mission != "permadefend"){
                scope.garrison.addUnits(this.removeUnits(Infinity));//Adds the units back into the garrison for defense
            }
        }
        
        if(opfor > 0){
            let mustKites = [];
            myUnits.forEach((unit) => {
                const name = unit.getTypeName();
                name === "Raider" || name === "Gatling Gun" ? mustKites.push(unit) : null;
            });//Things that have to kite or else, like raiders

            const center = scope.getCenterOfUnits(mustKites);
            let closeUnits = [];
            mustKites.forEach((unit) => {
                distanceFormula(unit.getX(), unit.getY(), enCenter.x, enCenter.y) < 7 ? closeUnits.push(unit) : null;
            });
            
            //Gets rid of the units that aren't fighting
            for(let i = closeUnits.length - 1; i > -1; i--){
                let unit = closeUnits[i];
                if(unit.getValue("hitCycle") == 0){
                    closeUnits.splice(i, 1);
                }
            }

            const dx = center.x - enCenter.x;
            const dy = center.y - enCenter.y;
            
            const hypot = Math.sqrt(dx**2 + dy**2);
            const len = 2;
            const dx2 = len * (dx / hypot);
            const dy2 = len * (dy / hypot);

            closeUnits.forEach((unit) => {
                scope.order("Move", [unit], {x: unit.getX() + dx2, y: unit.getY() + dy2});
                scope.order("AMove", [unit], center, true);
            });
        }
    }

    static manageWorkers(){
        let mines = getMyMinedMines();

        mines.forEach(mine => {
            let closestCastle = getClosestTo(myBuilds["CastleAndFortresses"], {x: mine.getX() + 1, y: mine.getY() + 1});
            //If the mine is close to the castle
            if(distanceFormula(closestCastle.getX() + 1.5, closestCastle.getY() + 1.5, mine.getX() + 1, mine.getY() + 1) < 10){ 
                let closeEnemies = getEnemiesAroundBuilding(mine, 15);
                if(isEnemyAroundBuilding(closestCastle, 10) && closeEnemies.length > 0){
                    //If there are enemies present
                    let mineX = mine.getX();
                    let mineY = mine.getY();
                    let closeWorkers = [];
                    
                    if(closeEnemies.length > 3){
                        //If there are a ton of enemies, run away.
                        miningWorkers.forEach(worker => distanceFormula(worker.getX(), worker.getY(), mineX + 1, mineY + 1) < 10 ? closeWorkers.push(worker) : null);
        
                        let acceptableSites = [];
                        myBuilds["CastleAndFortresses"].forEach(castle => castle.equals(closestCastle) ? null : acceptableSites.push(castle));
                        if(acceptableSites.length > 0){
                            let evacCastle = getClosestTo(acceptableSites, {x: mineX, y: mineY})
                            let evacSite = getClosestTo(mines, {x: evacCastle.getX(), y: evacCastle.getY()});//A micro trick.
                            //Mining workers cannot be blocked, so by sending them to a goldmine, they cannot be blocked.
                            scope.order("Moveto", closeWorkers, {unit: evacSite});
        
                            closeWorkers.forEach(worker => scope.evacedWorkers[worker.getUnitID()] = {"worker": worker, "evacedFrom": closestCastle});
                            scope.underAttack = true;
                        }
                    }else{
                        //If there aren't a ton of enemies (aka a drop is happening), worker rush those mother truckers
                        Us.workerRush(scope.getCenterOfUnits(closeEnemies), 15, closeEnemies.length * 3);
                    }
                }
            }
        });//Evacuates workers in the worker line that are close to enemies

        /*
        if(mines.length > 1 && scope.underAtack === false){
            let mineWorkers = [];
            mines.forEach(mine => {
                mineWorkloads.push(mine.getValue[lastWorkerCount]);
            });
            let idealRatio = miningWorkers.length / mines.length;
            let excessWorkers = [];
            mineWorkers.forEach(mineWorkersForMine => {
                if(mineWorkersForMine.length > idealRatio){
                    excessWorkers.push(mineWorkersForMine);
                }
            });
        }//Rearranges inefficent mining practices*/

        if(scope.underAttack === false){
            for(let id in scope.evacedWorkers){
                let obj = scope.evacedWorkers[id];
                scope.order("Moveto", [obj.worker], {unit: obj.evacedFrom});
            }
            scope.evacedWorkers = {};
        }//Reassigns workers back to their posts after the crisis has passed
    }

    static cleanArmies(){
        for(let id in scope.allArmiesByID){
            const army = scope.allArmiesByID[id];
            army.clean();
            if(army.canBeDeleted == true && Object.keys(army.unitsByID).length <= 0){
                //scope.chatMsg("Deleted an army with the mission of " + army.mission);
                delete scope.allArmiesByID[id];
                continue;
            }//Removes armies with no units in them
        }
    }

    static updateArmies(){
        let start = new Date();
        Army.cleanArmies();
        let end = new Date();
        let diff = end - start;
        if(diff > 2){
            //scope.chatMsg("cleaning armies took " + diff + " milliseconds");
        }
        //scope.chatMsg("There are " + Object.keys(scope.allArmiesByID).length + " armies.");
        scope.garrison?.addUnits(idleFightingUnits);
        for(let id in scope.allArmiesByID){
            const army = scope.allArmiesByID[id];
            let start = new Date();
            if(army.mission == "assault"){
                let start = new Date();
                for(let id in army.unitsByID){
                    let unit = army.unitsByID[id];
                    if(unit.getCurrentOrderName() == "Stop"){
                        scope.order("AMove", [unit], army.attackLoc);
                    }
                }
                let end = new Date();
                let diff = end - start;
                if(diff > 2){
                    //scope.chatMsg("Getting lazy units to move took " + diff + " milliseconds.");
                }
                //If units use abilites, they will stop in place and become useless.
                //This reorients them towards their goals.
            }else if(army.mission == "defend"){
                let start = new Date();
                if(scope.attackingFightingUnits.length <= 0){
                    scope.garrison.addUnits(army.removeUnits(Infinity));
                }
                let end = new Date();
                let diff = end - start;
                if(diff > 2){
                    //scope.chatMsg("Removing defenders took " + diff + " milliseconds.");
                }
                //If the army is done defending, put their units into the garrison.
            }
            let end = new Date();
            let diff = end - start;
            if(diff > 2){
                //scope.chatMsg("Updating mission specifics took " + diff + " milliseconds");
            }

            //Combines armies that are close to each other
            if(army.canBeDeleted == true){
                let thisCenter = scope.getCenterOfUnits(Object.values(army.unitsByID));
                for(let id in scope.allArmiesByID){
                    let oArmy = scope.allArmiesByID[id];
                    let oArmyUnits = Object.values(oArmy.unitsByID);
                    if(oArmyUnits.length <= 0){
                        continue;
                        //If the army does not have units or cannot be deleted, then it cannot be combined.
                    }
                    let oCenter = scope.getCenterOfUnits(oArmyUnits);

                    if(distanceFormula(thisCenter.x, thisCenter.y, oCenter.x, oCenter.y) < 10){
                        if(oArmyUnits.length > Object.keys(army.unitsByID).length){
                            //If the other army has more units, add our units into their command
                            oArmy.addUnits(army.removeUnits(Infinity));
                            //scope.chatMsg(getMyColor() + ": Combined an army with mission of " + army.mission + " into another army with mission of " + oArmy.mission);
                        }
                    }
                }
            }
        }
    }

    /**
     * A very general, somewhat resource-intensive function.
     * Currently: 
     * -Controls worker scouts
     * -Controls mech-specific stuff
     * -Targets enemy repairers/miners
     * -Produces birds when there are priests
     * -Controls airships
     */
    static armyBrain(){
        //Worker scouting
        if(fightingUnits.length < 1){
            if(scope.workerScout != undefined){
                let angryEnemyWorkers = scope.getUnits({type: "Worker", order: "AMove", enemyOf: me});
                angryEnemyWorkers = angryEnemyWorkers.concat(scope.getUnits({type: "Worker", order: "Attack", enemyOf: me}));

                if(scope.workerScout.getCurrentHP() <= scope.workerScout.getFieldValue("hp") * 0.35){
                    let closeMine = getClosestTo(scope.getBuildings("Goldmine"), {x: myBuilds["CastleAndFortresses"][0].getX(), y: myBuilds["CastleAndFortresses"][0].getY()});
                    scope.order("Mine", [scope.workerScout], {x: closeMine.getX(), y: closeMine.getY()}); 
                    //When workers mine, they cannot be blocked.
                    if(scope.trainingModeOn === true){
                        scope.chatMsg("Congratulations! You beat my worker scout!");
                    }
                    scope.workerScout = undefined;//makes sure the worker doesn't try any funny buisness anymore
                }else if(scope.workerScout.getCurrentHP() < scope.workerScout.getFieldValue("hp") && angryEnemyWorkers.length > 0){
                    let isClose = false;
                    for(let i = 0; i < angryEnemyWorkers.length; i++){
                        if(distanceFormula(angryEnemyWorkers[i].getX(), angryEnemyWorkers[i].getY(), scope.workerScout.getX(), scope.workerScout.getY()) < 2){
                            isClose = true;
                            break;
                        }
                    }
                    if(isClose === true){
                        kite([scope.workerScout]);
                    }
                }//If there is opposition and the enemy workers are close, kite. If the
                //worker scout is at less than 35 percent health, retreat back to the
                //main base so that the bot doesn't lose more income than nessecary.
            }
        }else{
            if(scope.workerScout != undefined && scope.workerScout.getCurrentHP() < scope.workerScout.getFieldValue("hp") * 0.5){
                if(myBuilds["CastleAndFortresses"].length > 0){
                    scope.order("Move", [scope.workerScout], myBuilds["CastleAndFortresses"][0]);
                }
            }
        }
        
        //Does mech-specific stuff
        if(myMechUnits.length > 0){
            //finds random workers to add to the mech repair squad and makes sure
            //they have not already been added to the squad.
            
            for(let i = scope.mechRepairSquad.length - 1; i > -1; i--){
                let worker = scope.mechRepairSquad[i];
                if(worker == undefined || worker.getValue("hp") <= 32){
                    scope.mechRepairSquad.splice(i, 1);
                }
            }
            
            
            //If there are not enough workers in the mech repair squad, add some.
            if(scope.mechRepairSquad.length < Math.floor(allWorkers.length * scope.mechRepairPercent)){
                miningWorkers = scope.getUnits({order: "Mine", type: "Worker", player: me});
                if(miningWorkers.length > 0){
                    let SENTINEL = 0;
                    while(true){
                        SENTINEL++;
                        let proposedWorker = miningWorkers[Randomizer.nextInt(0, miningWorkers.length - 1)];
                        let isGood = true;
                        
                        //Makes sure that the proposed worker is not already in the mech
                        //repair squad
                        if(proposedWorker != undefined){
                            for(let i = 0; i < scope.mechRepairSquad.length; i++){
                                if(proposedWorker.equals(scope.mechRepairSquad[i]) === true){
                                    isGood = false;
                                    i = scope.mechRepairSquad.length;
                                }
                            }
                        }

                        if(isGood === true){
                            scope.mechRepairSquad.push(proposedWorker);
                            break;
                        }

                        if(SENTINEL > allWorkers.length){
                            scope.chatMsg("armyBrain: SENTINEL has been triggered.");
                            break;
                        }//Basically if there are no workers to be found, break. Really
                        //shouldn't happen unless there is a bug somewhere else.
                    }
                }
            }
            
            //Orders the repair of mechanical units and makes sure they have
            //nearby workers for repair operations.
            if(myMechUnits.length > 0){
                let unassignedRepairers = [];
                for(let i = 0; i < scope.mechRepairSquad.length; i++){
                    unassignedRepairers.push(scope.mechRepairSquad[i]);
                }//Because of JS magic, if you just use 
                //let unassignedRepairers = scope.mechRepairSquad, unassignedRepairers will
                //be an array of references to scope.mechRepairSquad (a shallow copy), kind
                //of like an array of workers or soldiers or whatever. This means that
                //if a change is made to unassignedRepairers without using the bit of code
                //above, it will not only change unassignedRepairers, it will also change
                //scope.mechRepairSquad.

                //FYI, I spent over 4 hours trying to find this bug, so please appriciate 
                //that for a moment.
                
                let repairOrders = 0;
                let damagedMechs = [];
                myMechUnits.forEach(function(mech){
                    if(mech.getCurrentHP() < mech.getFieldValue("hp")){//if the mech is at less than full health
                        damagedMechs.push(mech);
                        let repairer = getClosestTo(unassignedRepairers, {x: mech.getX(), y: mech.getY()});
                        if(repairer != null){
                            scope.order("Repair", [repairer], {"unit": mech});
                            repairOrders++;

                            for(let ii = 0; ii < unassignedRepairers.length; ii++){
                                if(repairer.equals(unassignedRepairers[ii]) === true){
                                    unassignedRepairers.splice(ii, 1);
                                    ii = unassignedRepairers.length + 1;
                                }
                            }//Removes the just ordered worker from the pool of
                            //potential repairers.
                        }
                    }//If the unit is damaged, send the nearest squad member to
                    //repair
                });
                if(repairOrders > 0){
                    if(scope.mechRepairSquad.length - repairOrders > 0){
                        for(let i = 0; i < scope.mechRepairSquad.length; i++){
                            let repairer = scope.mechRepairSquad[i];
                            scope.order("Repair", [repairer], {unit: getClosestTo(damagedMechs, {x: repairer.getX(), y: repairer.getY()})});
                        }
                    }
                }//If there are any leftover workers and there is a damaged mech, go repair it

                let angryMechs = [];
                
                myMechUnits.forEach(function(mech){
                    let order = mech.getCurrentOrderName();
                    if(order === "AMove" || order === "Attack"){
                        angryMechs.push(mech);
                    }
                });
                
                let center = scope.getCenterOfUnits(angryMechs);
                if(angryMechs.length > 2){
                    unassignedRepairers.forEach(function(worker){
                        if(worker != null){
                            scope.order("Move", [worker], center);
                        }
                    })//Sends the mech repair squad with any angry mechanical 
                    //units for quicker repair. Sends workers to the closest
                    //mechanical unit near them if they are not repairing.
                }//Makes sure workers are not pulled for scouting parties
            }
        }//end mech-specific stuff


        //Targets enemy repairers and commits mining worker genocide
        let targetThese = scope.getUnits({type: "Worker", order: "Repair", enemyOf: me});
        targetThese = targetThese.concat(scope.getUnits({type: "Worker", order: "Mine", enemyOf: me}));

        fightingUnits.forEach(function(unit){
            let idx = getClosestTo(targetThese, {x: unit.getX(), y: unit.getY()}, true);
            if(idx != null){
                let worker = targetThese[idx];
                targetThese.splice(idx, 1);
                if(distanceFormula(unit.getX(), unit.getY(), worker.getX(), worker.getY()) < 7){
                    scope.order("Attack", [unit], {unit: worker});
                }
            }
        });

        //If the enemy has priests, panic and produce birbs with invis detection.
        let enemyPriests = scope.getUnits({type: "Priest", enemyOf: me});
        if(enemyPriests.length > 0){
            scope.subMetaPrios["Units"].push("Bird");
            scope.subMetaPrios["Upgrades"].push("Bird Detection");
        }
        
        //If there are units around the airship, drop the units.
        if(myUnits["Airship"] != undefined){
            let targetThese = scope.getUnits({type: "Worker", order: "Mine", enemyOf: me});
            myUnits["Airship"].forEach(ship =>{
                
                //finds the drop troops
                let dropTroops = [];
                fightingUnits.forEach(unit => {
                    if(distanceFormula(ship.getX(), ship.getY(), unit.getX(), unit.getY()) < 6){
                        dropTroops.push(unit);
                    }
                });
                
                dropTroops.forEach(unit => {
                    //If the unit is damaged, pull it
                    if(unit.getCurrentHP() < unit.getFieldValue("hp") * 0.2){
                        scope.order("Load in", [ship], {unit: unit}, true);
                    }
                })
                
                dropTroops.forEach(unit => {
                    let idx = getClosestTo(targetThese, {x: unit.getX(), y: unit.getY()}, true);
                    if(idx != null){
                        let worker = targetThese[idx];
                        targetThese.splice(idx, 1);
                        if(distanceFormula(unit.getX(), unit.getY(), worker.getX(), worker.getY()) < 7){
                            scope.order("Attack", [unit], {unit: worker});
                        }
                    }
                });
                
                if(dropTroops.length <= 0 && ship.getValue("freeCargo") >= 4){
                    //If the drop has died or retreated
                    exfil([ship]);
                }else{
                    let firstUnit = ship.getValue("cargo")[0];
                    if(firstUnit != undefined && isEnemyAroundBuilding(ship) == true && firstUnit.hp >= firstUnit.type.hp * 0.5){
                        //scope.chatMsg("Attempting to unload.");
                        scope.order("Unload", [ship], {x: ship.getX(), y: ship.getY()});
                    }
                }
                
                
            });
            
            if(scope.myPower > 10){
                Army.conductDrop();
            }
        }
    }

    /**
     * Pulls damaged units from the armies
     */
    static pullDamaged(){
        let damaged = [];
        fightingUnits.forEach(unit => {
            if(unit.getValue('hp') < unit.getFieldValue('hp') * 0.15){
                damaged.push(unit);
            }
        });

        if(fightingUnits.length > 2 && damaged.length < fightingUnits.length / 2){
            exfil(damaged);
        }
    }
    
    static conductDrop(){
        if(myUnits["Airship"] == undefined){
            return;
        }
        
        let troops = fightingUnits.slice();
        
        myUnits["Airship"].forEach(airship => {
            if(!isEnemyAroundBuilding(airship)){
                let ax = airship.getX();
                let ay = airship.getY();
                let cargoSpaceUsed = 0;
                for(let i = troops.length - 1; i > -1; i--){
                    let unit = troops[i];
                    if(distanceFormula(unit.getX(), unit.getY(), ax, ay) < 15){
                        scope.order("Load in", [airship], {unit: unit}, true);
                        troops.splice(i, 1);
                        cargoSpaceUsed += unit.getValue("cargoUse");
                        if(cargoSpaceUsed >= 10){
                            i = -1;
                        }
                    }
                }
            }
        });
        
        if(myUnits["Airship"][0].getValue("freeCargo") <= 1){
            //Gets the path from the center of the airships to an enemy's main base, then compresses the path (only the turns remain);
            let target = scope.getStartLocationForPlayerNumber(getRandomEnemyNr());
            target.x += Randomizer.nextInt(-2, 6);
            target.y += Randomizer.nextInt(-2, 6);
            let path = Grid.compressPath(Grid.findDropPath(scope.getCenterOfUnits(myUnits["Airship"]), target));
            
            //Orders the airships to move their lazy rear ends.
            for(let i = path.length - 1; i > -1; i--){
                scope.order("Move", myUnits["Airship"], path[i], true);
            }
        }
    }
}

/**
 * A data structure that's basically a 2-D array with benefits.
 */
class Grid {
    /**
     * Constructs a grid.
     * 
     * @param {array} nodes - An array of nodes. Each should be indexed 
     */
    static calcedPaths = {};
    constructor(nodes){
        this.grid = nodes;//Makes a copy of the nodes
        nodes.forEach((col, xIdx) => col.forEach((node, yIdx) => {
            node.xIdx = xIdx;
            node.yIdx = yIdx;
        }));//Sets the cost of the nodes depending on if they are blocked or not.
    }

    findPath(startX, startY, endX, endY, debug = false){
        this.grid.forEach(col => col.forEach(node => {
            node.g = 0;
            node.h = 0;
            node.f = 0;
            node.cost == undefined ? node.cost = 0 : null;
            node.open = true;
            delete node.parent;
        }));
        
        this.checkThese = [];

        this.startNode = this.getNodeAt(startX, startY);
        let startBlockValue = this.startNode.blocked;
        if(startBlockValue > 0){
            this.startNode.blocked = 0;
        }
        //this.startNode.open = false;
        this.endNode = this.getNodeAt(endX, endY);

        this.calcID = this.startNode.xIdx.toString() + ": " + this.startNode.yIdx.toString() + ": " + this.endNode.xIdx.toString() + ": " + this.endNode.yIdx.toString();
        if(Grid.calcedPaths[this.calcID] != undefined){
            return Grid.calcedPaths[this.calcID]
        }//Searches if the path has already been found.

        this.hMult = 10;

        let leadNode;

        this.checkThese.push(this.startNode);
        let SENTINEL = 0;

        while(this.checkThese.length > 0){
            let lowestScore = 99999;
            let bestNode = null;
            let idx = null;
            this.checkThese.forEach((openNode, i) => {
                if(openNode.blocked == 0 && openNode.f < lowestScore){
                    lowestScore = openNode.f;
                    bestNode = openNode;
                    idx = i;
                }
            });
            let node = bestNode;
            if(node == null){
                break;
            }
            node.open = false;
            this.checkThese.splice(idx, 1);

            if(SENTINEL % 5 == 0){
                if(distanceFormula(node.xIdx, node.yIdx, this.endNode.xIdx, this.endNode.yIdx) > 10){
                    this.hMult = 11;
                }else{
                    this.hMult = 18;
                }
                //Adjusts how accurate we want to be. We really don't care if the path the pathfinder choses is
                //slightly longer than it really should be in the middle as long as it saves some CPU.
            }
            SENTINEL++;
            if(SENTINEL > 10000){
                //scope.chatMsg("ERROR: The pathfinding operation took too long!");
            }

            let neighbors = this.getNeighbors(node);
            let diagNeighbors = this.getDiagNeighbors(node);

            this.cycleNodes(node, neighbors, 10);
            this.cycleNodes(node, diagNeighbors, 14.2);

            if(node.x == this.endNode.x && node.y == this.endNode.y){
                leadNode = node;
                break;
                //If we reached the end, break.
            }
        }

        let path = [];
        SENTINEL = 0;
        while(true){
            SENTINEL++;
            if(SENTINEL > 1000){
                scope.chatMsg("Path tracing took too long!");
                break;
            }
            if(leadNode == undefined || leadNode.parent == undefined){
                break;
            }
            path.push(leadNode.parent);
            leadNode = leadNode.parent;
        }

        Grid.calcedPaths[this.calcID] = path;
        
        if(startBlockValue > 0){
            this.startNode.blocked = startBlockValue;
        }//Changes the block value back.

        return path;
    }

    /**
     * Gets the diagonal neighbors of a node.
     * 
     * @param {node} node - The center node.
     * 
     * @returns {array} - An array of diagonal neighbors.
     */
    getDiagNeighbors(node){
        let returnArr = [];

        
        (this.getNodeAt(node.xIdx + 1, node.yIdx)?.blocked == 0 && this.getNodeAt(node.xIdx, node.yIdx + 1)?.blocked == 0) == true && returnArr.push(this.getNodeAt(node.xIdx + 1, node.yIdx + 1));
        (this.getNodeAt(node.xIdx, node.yIdx + 1)?.blocked == 0 && this.getNodeAt(node.xIdx - 1, node.yIdx)?.blocked == 0) == true && returnArr.push(this.getNodeAt(node.xIdx - 1, node.yIdx + 1));
        (this.getNodeAt(node.xIdx + 1, node.yIdx)?.blocked == 0 && this.getNodeAt(node.xIdx, node.yIdx - 1)?.blocked == 0) == true && returnArr.push(this.getNodeAt(node.xIdx + 1, node.yIdx - 1));
        (this.getNodeAt(node.xIdx - 1, node.yIdx)?.blocked == 0 && this.getNodeAt(node.xIdx, node.yIdx - 1)?.blocked == 0) == true && returnArr.push(this.getNodeAt(node.xIdx - 1, node.yIdx - 1));

        for(let i = returnArr.length - 1; i > -1; i--){
            (returnArr[i].blocked == 0 && returnArr[i] == null) ? returnArr.splice(i, 1) : null;
        }

        return returnArr;
    }

    /**
     * A bit of a complex function. 
     * 
     * With open neighbor nodes: Basically updates the f score, the g score, and the h score
     * With closed neighbor nodes: If the the closed neighbor has a lower g score, then the function
     *  will switch the provided node's parent to the neighboring node.
     * 
     * @param {node} node - The center of the cycling.
     * @param {array} neighbors - An array of neighbors.
     * @param {number} weight - The cost to go from the node to each neighbor.
     */
    cycleNodes(node, neighbors, weight){
        for(let i = neighbors.length - 1; i > -1; i--){
            (neighbors[i].f == -1 || neighbors[i].blocked > 0) ? neighbors.splice(i, 1) : null;
        }

        neighbors.forEach(nNode => {
            if(nNode.open == true){
                nNode.g = node.g + weight;
                nNode.h = this.hMult * octile(Math.abs(nNode.xIdx - this.endNode.xIdx), Math.abs(nNode.yIdx - this.endNode.yIdx));
                nNode.f = nNode.g + node.h + node.cost;

                
                this.checkThese.push(nNode);
                nNode.open = false;
                nNode.parent = node;
            }else{
                if(nNode.g + weight < node.g){
                    node.parent = nNode;
                }
            }
        });
    }

    /**
     * Gets the cardinal direction neighbors (up, down, left, and right).
     * 
     * @param {node} node - The node that the neighbors are next to.
     */
    getNeighbors(node){
        let returnArr = [];

        returnArr.push(this.getNodeAt(node.xIdx + 1, node.yIdx));
        returnArr.push(this.getNodeAt(node.xIdx - 1, node.yIdx));
        returnArr.push(this.getNodeAt(node.xIdx, node.yIdx + 1));
        returnArr.push(this.getNodeAt(node.xIdx, node.yIdx - 1));

        for(let i = returnArr.length - 1; i > -1; i--){
            (returnArr[i] == null || returnArr[i].blocked > 0) ? returnArr.splice(i, 1) : null;
        }

        return returnArr;
    }

    /**
     * Gets the node at a certain xIdx and yIdx.
     * 
     * @param {integer} xIdx - The index of the node in the x axis.
     * @param {integer} yIdx - the index of the node in the y axis.
     * 
     * @returns {node} - the node at that position.
     */
    getNodeAt(xIdx, yIdx){
        if(xIdx == null || yIdx == null || this.isInside(xIdx, yIdx) == false){
            return null;
        }
        return this.grid[Math.floor(xIdx)][Math.floor(yIdx)];
    }

    /**
     * If the provided coordinates are inside of the grid.
     * 
     * @param {integer} xIdx - The index of the node in the x axis.
     * @param {integer} yIdx - the index of the node in the y axis.
     * 
     * @returns {boolean} - Whether the coordinates are inside
     */
    isInside(xIdx, yIdx){
        if(xIdx < 0 || xIdx > this.grid.length - 1 || yIdx < 0 || yIdx > this.grid[0].length - 1){
            return false;
        }
        return true;
    }

    /**
     * Compresses a path so that only the turning points are returned.
     * 
     * @param {array} path - The path to be compressed.
     * 
     * @returns {array} - the compressed path. 
     */
    static compressPath(path){
        let compressed = [];
        let gs = 0.5;
        let lastAngle = 10;//An impossible value on purpose. 
        let lastNode = path[0];
        path.forEach((node, i) => {
            let angle = Math.atan2(((node.y + gs) - (lastNode.y + gs)), ((node.x + gs) - (lastNode.x + gs))).toFixed(2);//Rounds to nearest hundreth
            if(angle != lastAngle){
                compressed.push({x: lastNode.x + gs, y: lastNode.y + gs});
            }
            lastAngle = angle;
            lastNode = node;
        });
        return compressed;
    }
    
    static findDropPath(from, to){
        let mapNodes = [];
    
        let mapLen = scope.getMapWidth();
        let mapHei = scope.getMapHeight();
        for(let x = 0; x < mapLen; x++){
            let col = [];
            for(let y = 0; y < mapHei; y++){
                let node = new Node(x, y);
                node.open = true;
                col.push(node);
            }
            mapNodes.push(col);
        }
        let map = new Grid(mapNodes);
        
        let pad = 15;
        
        //Avoid scary stuff that could shoot down the airship
        let avoidThese = enemyBuildings.slice();
        enemyUnits.forEach(unit => (unit.getTypeName() == "Ballista" || unit.getTypeName == "Archer") ? avoidThese.push(unit) : null);
        
        avoidThese.forEach(scary => {
            if(scary.getTypeName() != "Castle"){
                let maxX = Math.ceil(scary.getX() + 2 + pad);
                let maxY = Math.ceil(scary.getY() + 2 + pad);
                let buildX = scary.getX() + 1;
                let buildY = scary.getY() + 1;
                for(let x = Math.floor(scary.getX() - pad); x < maxX; x++){
                    for(let y = Math.floor(scary.getY() - pad); y < maxY; y++){
                        if(map.isInside(x, y)){
                            map.getNodeAt(x, y).cost += (pad - distanceFormula(x, y, buildX, buildY)) * 100;
                        }
                        //Increase the cost of the node based on how close it is to a building.
                    }
                }
            }
        });
        
        let path = map.findPath(Math.floor(from.x), Math.floor(from.y), Math.floor(to.x), Math.floor(to.y));
        
        return path;
    }
    
    static generateMapNodes(){
        let mapNodes = [];
    
        let mapLen = scope.getMapWidth();
        let mapHei = scope.getMapHeight();
        for(let x = 0; x < mapLen; x++){
            let col = [];
            for(let y = 0; y < mapHei; y++){
                let node = new Node(x, y);
                node.open = true;
                node.heightLevel = scope.getHeightLevel(x, y);
                node.blocked = scope.c(x, y) == true ? 2 : 0;
                col.push(node);
            }
            mapNodes.push(col);
        }
        
        return new Grid(mapNodes);
    }
} 

/**
 * A node in a grid. 
 * 
 * @param {number} x - x-coordinate of the node in the graphics canvas
 * @param {number} y - y-coordinate of the node in the graphics canvas
 * @param {number} blocked - What block state the node is in. Defaults to UNBLOCKED.
 */
class Node {
    constructor(x, y, blocked = 0){
        this.blocked = blocked;
        this.x = x;
        this.y = y;
        this.cost = 0;
    }
}

if(time > 1){
    Us.update();
}

if(scope.bases.length <= 0){
    let startLoc = scope.getStartLocationForPlayerNumber(me);
    if(startLoc == undefined && scope.firstCastle != undefined){
        startLoc = {x: scope.firstCastle.getX(), y: scope.firstCastle.getY()};
        //Sometimes because of LWG magic, startLocation will return undefined. In that case,
        //the bot will default to the first castle's coordinates.
    }
    if(typeof startLoc === "object"){
        let base = new Base(startLoc.x + 2, startLoc.y + 2);
    }
}

/**
 * Distance formula.
 * 
 * @param x1 {number} - first x coordinate
 * @param y1 {number} - first y coordinate 
 * @param x2 {number} - second x coordinate
 * @param y2 {number} - second y coordinate
 * @returns {number} - the distance between the two sets of coordinates, unrounded.
 */

function distanceFormula(x1, y1, x2, y2){
    return Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
}

/**
 * Not square-rooted distance formula.
 * 
 * @param x1 {number} - first x coordinate
 * @param y1 {number} - first y coordinate 
 * @param x2 {number} - second x coordinate
 * @param y2 {number} - second y coordinate
 * @returns {number} - the distance between the two sets of coordinates, unsquarooted.
 */
function unsqrtDist(x1, y1, x2, y2){
    return (x2 - x1)**2 + (y2 - y1)**2;
}

/**
 * Kites with units. THIS IS ONLY A SINGLE CYCLE!!! Calling this function will
 * make the specified units retreat, then ONE SECOND later will turn around
 * and attack. You can also pass a delay for a custom delay.
 * 
 * @param {array} units - units that will kite.
 * @param {integer} delay - the delay (in milliseconds) before the units will
 *  turn around and attack
 */
function kite(units, delay = 1000){
    exfil(units);
    setTimeout(attackWith, delay, units);
}

/**
 * Unlike kiting, this won't send the units back to the base. Instead, it will cause the units to randomly
 * move.
 * 
 * @param {array} units - an array of units.
 * @param {number} delay - the delay before the units return.
 */
function stutterStep(units, delay){
    let moveX = Randomizer.nextInt(-5, 5);
    let moveY = Randomizer.nextInt(-5, 5);
    units.forEach(function(unit){
        scope.order("Move", [unit], {x: unit.getX() + moveX, y: unit.getY() + moveY});
    });
    setTimeout(attackWith, delay, units);
}

/**
 * A special function for special attacks, such as worker rushes, that don't
 * use the normal fighting units. Overrides other orders. Will throw an error
 *  if not passed an array.
 * 
 * @param {array} units - the units that will receive the attack order.
 */
function attackWith(units){
    if(typeof units != "object" || units.length == undefined){
        throw new TypeError("attackWith: You must pass a valid array of units! Recived units parameter: " + JSON.stringify(units));
    }
    let location = Us.getRandAttackLoc();  
    scope.order("AMove", units, location);
}

/**
 * Actually chats out a specified message. Will add the color of the bot (red, 
 * blue, etc. to the message body.)
 * 
 * @param {string} chatThis - what the bot should say.
 */
function botChat(chatThis){
    if(scope.mute === false){
        let color = getMyColor();
        scope.chatMsg(color + ": " + chatThis); 
    }
}

function getMyColor(){
    let color;
    if(me === 1){
		color = "Red"
	}
	if(me === 2){
		color = "Blue"
	}
	if(me === 3){
		color = "Green"
	}
	if(me === 4){
		color = "White"
	}
	if(me === 5){
		color = "Black"
	}
	if(me === 6){
		color = "Yellow"
	}
	return color;
}

function doBotChat(){
    if(scope.player.isAlive == false){
        return;
    }
    let chatter = new RandChatter();
    chatter.chat();
    
    scope.nextTalkTick += Randomizer.nextInt(10, 15);
}

/**
 * Directly interfaces with myBuilds.combatUnitProducers in order to bring us
 * joy and satisfaction in life. (actually removes blacklisted combat unit 
 * producers in the array scope.dontProduceFromThese from the array 
 * myBuilds.combatUnitProducers). Very clunky, but works (I think)
 * 
 */
function filterDontProducers(){
    for(let i = myBuilds.combatUnitProducers.length - 1; i > -1; i--){
        if(scope.dontProduceFromThese.has(myBuilds.combatUnitProducers[i].getTypeName()) === true){
            myBuilds.combatUnitProducers.splice(i, 1);
        }
    }//runs backwards to ensure that holes in the array don't interfere with the accuracy of the index.
}

/**
 * Gets the closest unit in an array to a set of coordinates
 * 
 * @param {array} arr - An array of units
 * @param {object} coordinates - An object in the format of {x: x, y: y}
 * @param {boolean} returnIndex - if set to true, then the function will retun the index of the closest unit in the array.
 * 
 * @returns {element} - the closest unit from the array, null if arr.length is 0
 */
function getClosestTo(arr, coordinates, returnIndex = false){
    if(typeof coordinates != "object" || typeof coordinates.x != "number" || typeof coordinates.y != "number"){
        throw new TypeError("getClosestTo: You must pass a valid coordinate object! Recived object: " + JSON.stringify(coordinates));
    }
    let nearestUnit = null;
    let nearestI = null;
    let nearestDist = 99999;
    arr.forEach(function(unit, i){
        if(unit != undefined){
            let dist = unsqrtDist(unit.getX(), unit.getY(), coordinates.x, coordinates.y);
            if(dist < nearestDist){
                nearestUnit = unit;
                nearestI = i;
                nearestDist = dist;
            }
        }
    });
    
    if(returnIndex === false){
        return nearestUnit;
    }else{
        return nearestI;
    }
}

/**
 * A function to exfiltrate units, aka running away. This function makes units
 * run away to the nearest watchtower. If there is no watchtower built or all
 * of the watchtowers are destroyed, it will retreat to a castle. If the center of the
 * specified units is within five squares of the center of the watchtower, it 
 * will retreat to a random castle.
 * 
 * Note that there is a one in four chance that the bot will talk trash when
 * retreating.
 * 
 * @param {array} units - the units to exfil.
 */

function exfil(units){
    if(units.length <= 0 || scope.canRetreat === false || myBuilds["allBuilds"].length <= 0){
        return;
    }
    let chatLine;
    let retreatBuilding;
    const watchtowers = myBuilds["Watchtowers"];
    const castles = myBuilds["CastleAndFortresses"];
    let center = scope.getCenterOfUnits(units);
    if(watchtowers.length > 0){
        let nearestWatchtower = null;
        let nearestDist = 99999;
        for(let i = 0; i < watchtowers.length; i++){
            let watchtower = watchtowers[i];
            let dist = Math.pow((watchtower.getX() + 1.5) - center.x, 2) + Math.pow((watchtower.getY() + 1.5) - center.y, 2);
            if(dist < nearestDist){
                nearestWatchtower = watchtower;
                nearestDist = dist;
            }
        }
        retreatBuilding = nearestWatchtower;
    }else if(castles.length > 0){
        retreatBuilding = castles[Randomizer.nextInt(0, castles.length - 1)]
    }else{
        return;
    }
    
    if(distanceFormula(center.x, center.y, retreatBuilding.getX() + 2, retreatBuilding.getY() + 2) <= 9){
        return;
    }
    
    scope.order("Moveto", units, {unit: retreatBuilding});//orders a retreat to the main base
}

/**
 * Returns a boolean if there are enemies in the vicinity of a building. The
 * function references scope.buildingSizes for building sizes, and if
 * you are playing on a modded map or for any reason scope.buildingSizes does
 * not have a size listed for a passed building, it will default to the upper
 * left hand corner of the check building as the center of the checking circle.
 * 
 * @param {building} building - the building to be checked.
 * @param {number} radius - the raidus (calculated from the center of the 
 *  building) where enemy units will be registered.
 * @returns {boolean} - if the building has enemies around it.
 */
function isEnemyAroundBuilding(building, radius = 10){
    let centerX;
    let centerY;
    if(scope.buildingSizes[building.getTypeName] == undefined){
        centerX = building.getX();
        centerY = building.getY();
    }else{
        centerX = building.getX() + scope.buildingSizes[building.getTypeName()][0] / 2;
        centerY = building.getY() + scope.buildingSizes[building.getTypeName()][1] / 2;
    }
    for(let i = 0; i < enemyUnits.length; i++){
        let unit = enemyUnits[i];
        
        if(unit != undefined){
            if(distanceFormula(unit.getX(), unit.getY(), centerX, centerY) < radius){
                return true;
            }
        }
    }
    return false;
}

function getEnemiesAroundBuilding(building, radius = 10){
    let centerX;
    let centerY;
    let units = [];
    if(scope.buildingSizes[building.getTypeName] == undefined){
        centerX = building.getX();
        centerY = building.getY();
    }else{
        centerX = building.getX() + scope.buildingSizes[building.getTypeName()][0] / 2;
        centerY = building.getY() + scope.buildingSizes[building.getTypeName()][1] / 2;
    }
    
    for(let i = 0; i < enemyUnits.length; i++){
        let unit = enemyUnits[i];
        
        if(unit != undefined){
            if(distanceFormula(unit.getX(), unit.getY(), centerX, centerY) < radius){
                units.push(unit);
            }
        }
    }
    return units;
}

/**
 * Gets mines that are within 15 units of the center of a castle, exclusive.
 * 
 * @returns {array} - an array of not mined mines
 */
function getMyMinedMines(){
    let mines = getMinesWithGold();
    let minedMines = [];
    for(let i = 0; i < mines.length; i++){
        let mine = mines[i];
        let isUnmined = true;
        for(let ii = 0; ii < myBuilds["CastleAndFortresses"].length; ii++){
            let castle = myBuilds["CastleAndFortresses"][ii];
            if(Math.ceil(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, castle.getX() + 2, castle.getY() + 2)) <= 15){
                isUnmined = false;
                //ii = myBuilds["CastleAndFortresses"].length;
            }
        }
        
        if(isUnmined === false){
            minedMines.push(mine);
        }
    }
    return minedMines;
}

/**
 * Gets workers that are not mining
 * 
 * @returns {array} - An array of not mining workers
 */
function getNotMiningWorkers(){
    let notMining = [];
    for(let i = 0; i < allWorkers.length; i++){
        let worker = allWorkers[i];
        let order = worker.getCurrentOrderName();
        if(order != "Mine"){
            notMining.push(worker);
        }
    }
    return notMining;
}

/**
 * A function to get unmined mines (mines that are not close to enemy start
 * locations or known enemy castles (< 15 squares)
 * 
 * @returns {array} - an array of unmined mines
 */

function getUnminedMines(){
    let mines = getMinesWithGold();
    let allCastles = scope.getBuildings({type: "Castle"}).concat(scope.getBuildings({type: "Fortress"}));
    
    let unminedMines = [];
    let allPlayers = scope.getArrayOfPlayerNumbers();
    for(let i = 0; i < mines.length; i++){
        let mine = mines[i];
        let isUnmined = true;
        for(let ii = 0; ii < allCastles.length; ii++){
            let castle = allCastles[ii];
            if(Math.round(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, castle.getX() + 2, castle.getY() + 2)) <= 15){
                isUnmined = false;
                //ii = allCastles.length;
            }else{
                for(let player = 0; player < allPlayers.length; player++){
                    let startLoc = scope.getStartLocationForPlayerNumber(allPlayers[player]);
                    if(startLoc != undefined && allPlayers[player] != me){
                        if(distanceFormula(mine.getX() + 1.5, mine.getY() + 1.5, startLoc.x, startLoc.y) <= 15){
                            isUnmined = false;
                        }
                    }
                }
            }
        }
        
        if(isUnmined === true){
            unminedMines.push(mine);
        }
    }
    return unminedMines;
}

/**
 * A function to get a random enemy number.
 * 
 * @returns {integer} - Gets a random enemy number
 */

function getRandomEnemyNr(){
    let rand = me;
    let SENTINEL = 0;
    let players = scope.getArrayOfPlayerNumbers();
    let myTeam = scope.getTeamNumber(me);
    
    while(rand == me || scope.getTeamNumber(rand) == myTeam){
        SENTINEL++;
        if(SENTINEL > 20){
            scope.chatMsg("getRandomEnemyNr: SENTINEL has been triggered.");
            break;
        }
        rand = players[Randomizer.nextInt(0, players.length - 1)];
    }
    return rand;
}

/**
 * A function to find a random key from a object containing a list of weighted
 * priorites in the format of 
 * {"Soldier": 0,
 * "Archer": 0.1,
 * "Werewolf": 1.2
 * }
 * 
 * Note that if the key's value is higher, it will have a higher chance of being
 * picked (usually). Also note that the values are NOT percentage-convertable,
 * because it depends on how many other values are present. For example, this:
 * 
 * {"Soldier": 0.5,
 * "Archer":0}
 * 
 * Means that there is a 100% chance of a soldier being picked.
 * This, however:
 * 
 * {"Soldier": 0.1,
 * "Archer": 0.1}
 * 
 * Means that the soldier has a 50% chance of being picked, and the Archer also
 * has a 50% chance of being picked. 
 * 
 * Let's take a look at this object:
 * 
 * {"Soldier": 0.1,
 * "Archer": 0.2,
 * "Werewolf": 0.15
 * 
 * In math terms of the weighted priority object above, 0.1 + 0.2 + 0.15 = 0.45,
 * so the function will pick a number between 0 and 0.45. If the value falls 
 * between 0 and 0.1, the soldier will be picked. If the value falls between 0.1
 * and 0.3, the Archer will be picked. If the value falls between 0.3 and 0.45, 
 * then the werewolf will be picked.
 * 
 * @param {object} obj - the object from which the key is randomly chosen from.
 * @returns {string} - the randomly chosen string from the above object
 */

function findRandomPrioKey(obj){
    const min = 0.01;//if the number is 0, then it can't be produced
    let max = 0;
    
    let chatThis = [];
    for(let key in obj){
        max += obj[key];
        if(obj[key] > 0){
            chatThis.push(key + ", " + obj[key]);
        }
    }
    
    if(max < min){
        return;
    }//if there is nothing prioritized - return.
    
    let randomNum = 0;
    while(randomNum === 0){
        randomNum = Math.round((Math.random() * (max - min) + min) * 100) / 100;
    }
    let lastNum = 0;
    
    let buildThis;
    for(let key in obj){
        let cur = lastNum + obj[key]
        if(randomNum <= cur && cur > lastNum){
            buildThis = key;
            break;
        }else{
            lastNum += obj[key];
        }
    }//loops through build priority and finds the build that brackets randomNum.
    //visualization: [--x--House--][---Barracks--] (x is randomNum)
    
    return buildThis;
}

/**
 * Gets mines with gold.
 * 
 * @returns {array} - An array of gold mines that have gold.
 */

function getMinesWithGold(){
    return scope.getBuildings({type: "Goldmine"}).filter(mine => mine.getValue('gold') > 0);
}



/**
 * Trains a unit. By calling this function, a unit will be trained in all available production buildings
 * as listed in the global object productionBuildings. You may specify an amount of units to be trained,
 * but by default the function will train as many as the bot currently has resources for.
 * 
 * @param {string} unit - The string typeName of whatever unit should be trained.
 * @param {number} amount - Optional. How many units should be trained. Defaults to Infinity.
 * @param {boolean} singleProduction - If the unit should only be trained in buildings that aren't currently
 *  producing anything. Defaults to true.
 * 
 * @returns {integer} - The amount of units trained
 */
function trainUnit(unit, amount = Infinity, singleProduction = true){
    let productionBuildings = myBuilds[scope.unitProducedAt[unit]];
    
    if(productionBuildings == undefined){
        throw new TypeError("unit " + unit + " does not have a production building listed.");
    }else if(productionBuildings.length <= 0){
        //scope.chatMsg("unit " + unit + " does not have enough production buildings.");
        return 0;
    }
    
    let costPerUnit = scope.getTypeFieldValue(unit.toLowerCase(), "cost");
    let curCost = 0;
    
    for(let i = 0; i < productionBuildings.length; i++){
        if(singleProduction == false || productionBuildings[i].getUnitTypeNameInProductionQueAt(1) == undefined){
            curCost += costPerUnit;
            if(curCost > gold || i >= amount){
                return i;
            }
            if(unit === "Ballista" || unit === "Airship" || unit === "Catapult" || unit === "Gatling Gun" || unit === "Gyrocraft"){
                scope.order("Construct " + unit, [productionBuildings[i]]);
            }else{
                scope.order("Train " + unit, [productionBuildings[i]]);
            }
        }
    }
    
    return Math.round(curCost / costPerUnit);
}

/**
 * Checks to see if there is any enemy presence around a given spot,
 * including buildings and units.
 * 
 * @param {number} x - x position
 * @param {number} y - y position
 * @param {number} radius - the radius that the function will check around.
 * 
 * @returns {boolean} - Whether there is an enemy presence around a given
 * spot, exclusive.
 */
function isEnemyAroundPosition(x, y, radius = 15){
    enemyBuildings.forEach(build => {
        if(distanceFormula(build.getX() + 1.5, build.getY() + 1.5, x, y) < radius){
            return true;
        }
    });
            
    enemyUnits.forEach(unit => {
        if(distanceFormula(unit.getX(), unit.getY(), x, y) < radius){
            return true;
        }
    });

    return false;
}

/**
 * Gets each mining worker, puts it "in an object along with which mine the worker is mining.
 * 
 * @returns {array} - an array of objects with two properties set, "worker" and "mine".
 */
function getMiningWorkersWithMines(){
    let returnThis = [];
    miningworkers.forEach(worker => {
        returnThis.push({"worker": worker, "mine": worker.getValue("goldMine")});
    });
    return returnThis;
}

/**
 * If you've come this far, congratulations! I doubt you read everything above,
 * but nice job anyways. Programming is hard. I get asked a lot: "How did you
 * program this many lines of code?"
 * 
 * The answer is simple. One line at a time. (unless I'm copying somebody else's
 * work, which is fine as long credit is given and there's no copyright issues!)
 * 
 * I highly encourage you to continue learning and exploring programming. Sure, 
 * it's hard. Yes, it's fustrating at times. How can you overcome that fustration
 *  and hardness?
 * 
 * That is a question I cannot answer, because I can't give you motivation. 
 * You have to find that yourself, unfortunately. For me, it's the love of the 
 * challenge and just because I love solving problems. For you? That's something 
 * you will have to discover on your own.
 * 
 * If programming isn't your jam, then that's fine. There is plent of other things
 * to waste your life on. But at least give it a crack. Too many people fail
 * without even starting, and even if you wipe out miserably, at least you can 
 * fail while trying.
 * 
 * And the fact that you found this little note and bothered to read it is 
 * evidence that you are at least trying. For that, you can be pround of 
 * yourself. :)
*/

/**
 * A function that can check pathability and make sure that all squares are the same
 *  height level along a line.
 * 
 * @param {number} x1 - x coordinate of first coordinate set.
 * @param {number} y2 - y coordinate of first coordinate set.
 * @param {number} x1 - x coordinate of second coordinate set.
 * @param {number} y2 - y coordinate of second coordinate set.
 * @param {integer} heightComparison - If any of the squares checked along the
 *  line are not this height, then the function will return false.
 * @param {array} dontCheckThese - Coordinates that will be ignored during the
 *  checking process, even if they are unpahtable or have a different height
 *  level. Note that because of LWG magic, building's .getX() and .getY() 
 *  methods actually return the building's position plus 0.5 in both the
 *  x and y dimensions. So, if a building is actually at (2, 2), LWG magic
 *  will return (2.5, 2.5). In order to be accurate, this function will NOT
 *  round those numbers if they are passed. If valid integers are not passed,
 *  the function will throw an error.
 * @param {boolean} checkIfPathable - If the function should also check if the
 *  line is pathable. Defaults to true.
 * @returns {boolean} - If there are height differences and/or unpathable positions
 *  along the chekline.
 */
function checkAlongLine(x1, y1, x2, y2, heightComparison, dontCheckThese, checkIfPathable = true){

    dontCheckThese.forEach(function(arr){
        if(Number.isInteger(arr[0]) === false || Number.isInteger(arr[1]) === false){
            throw new TypeError("checkAlongLine: You must pass valid, integer coordinates to dontCheckThese! Did you forget that the LWG AI API adds 0.5 to coordinates?");
        }
    });

    let cx = x2;
    let cy = y2;

    //Two sides of the triangle; opposite and adjacent in the x and y dimensions.
    let dx = (x1) - (x2);
    let dy = (y1) - (y2);

    //Hypotonuse
    const dist = distanceFormula(x1, y1, x2, y2);
    
    //let coordinates = [];

    //let iterations = 0;

    for(let i = 0; i < dist; i++){
        //iterations++;
        cx += dx / dist;
        cy += dy / dist;

        let rcx = Math.floor(cx);
        let rcy = Math.floor(cy);

        //coordinates.push(" " + JSON.stringify([Math.round(cx), Math.round(cy)]));

        let doCheck = true;
        for(let ii = 0; ii < dontCheckThese.length; ii++){
            if(dontCheckThese[ii][0] === rcx && dontCheckThese[ii][1] === rcy){
                doCheck = false;
                ii = dontCheckThese.length;
            }
        }//Runs through dontCheckThese and makes sure that the coordinates are not on there.

        if(doCheck === true && ((scope.getHeightLevel(rcx, rcy) != heightComparison) || (checkIfPathable === true && scope.positionIsPathable(rcx, rcy) === false))){
            return false;
        }
    }

    return true;
    //scope.chatMsg(getMyColor() + "'s fails: dx: " + dx + ", dy: " + dy + ", cx: " + cx + ", cy: " + cy + ", dist: " + dist + ", sucess: " + sucess + ", coordinates: " + JSON.stringify(coordinates) + ", fails: " + checklineFails + ", Iterations: " + iterations); 
}

/**
 * Generates a unique ID in an object.
 */
function generateID(obj){
    while(true){
        let propID = Randomizer.nextInt(100000, 999999);
        if(!obj[propID]){
            return propID;
        }
    }
}

function average(array) {
    return array.reduce((a, b) => a + b) / array.length;
}

function octile(dx, dy){
    const F = Math.SQRT2 - 1;
    return ((dx < dy) ? F * dx + dy : F * dy + dx);
}

if(scope.trainingModeOn === true){
    if(time === 0){
        scope.doChat = false;
        scope.chatMsg("Make a worker, set the castle's waypoint below the goldmine.");
    }else if(time === 5){
        scope.chatMsg("This way, when your worker is made, it can make a house!");
    }else if(time === 15){
        scope.chatMsg("Make another worker.");
    }else if(time === 29){
        scope.chatMsg("Send worker from the castle to build a house below goldmine!");
    }else if(time === 32){
        scope.chatMsg("Return castle waypoint to the goldmine, and put 2 more workers in the queue!");
    }else if(time === 53){
        scope.chatMsg("Here comes my worker scout now. Dispatch two workers to attack!")
    }else if(time === 83){
        scope.chatMsg("For the last worker in queue, set castle waypoint down at the bottom of the ramp");
    }else if(time === 85){
        scope.chatMsg("Send worker to 2nd goldmine on 265 gold!!");
    }else if(time === 103){
        scope.chatMsg("When worker from castle is sent build a den leaving a 2x2 gap in the ramp!!");
    }else if(time === 108){
        scope.chatMsg("When Gold is at 30 send a worker do build a 2nd den!!!");	
    }else if(time === 135){
        scope.chatMsg("Keep going!");
    }

    if(scope.justAttacked === true && scope.saidAttack === undefined){
        scope.chatMsg("I am going to attack soon, so get ready!");
        scope.justAttacked = false;
        scope.saidAttack = true;
    }
}

if(time == 2){
    //scope.chatMsg("We created the garrison!");
    scope.garrison = new Army([]);
    scope.allArmiesByID[scope.garrison.armyID].canBeDeleted = false;
    //scope.chatMsg("After creating, there are " + Object.keys(scope.allArmiesByID).length + " armies.");
    scope.defenseArmy = new Army([]);
    scope.allArmiesByID[scope.defenseArmy.armyID].canBeDeleted = false;
    scope.allArmiesByID[scope.garrison.armyID].mission = "permadefend";//permanent defense
    scope.defenseArmy.mission = "defend";
    
    let mapNodes = [];
    
    let mapLen = scope.getMapWidth();
    let mapHei = scope.getMapHeight();
    for(let x = 0; x < mapLen; x++){
        let col = [];
        for(let y = 0; y < mapHei; y++){
            let node = new Node(x, y);
            node.open = true;
            node.heightLevel = scope.getHeightLevel(x, y);
            node.blocked = scope.positionIsPathable(x, y) == true ? 2 : 0;
            col.push(node);
        }
        mapNodes.push(col);
    }
    
    scope.mapNodes = new Grid(mapNodes);
}
scope.lastNumOfBuildings = myBuilds.allBuilds.length;

if(chatAtEnd.length > 0){
    scope.chatMsg(JSON.stringify(chatAtEnd).replaceAll(",", ", "));
}
