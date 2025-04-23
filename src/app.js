import React, { useState } from "react";

// Pixel offset for stair-step layout
const CELL_GAP = 32;
// Seed order mapping for Round of 64
const SEED_ORDER = ["1\n16",16,"8\n9",9,"5\n12",12,"4\n13",13,"6\n11",11,"3\n14",14,"7\n10",10,"2\n15",15];

// First-round team names by region
const regions = [
  { name: "East",  teams: [
      "Duke","Mount St. Mary's","Mississippi State","Baylor",
      "Oregon","Liberty","Arizona","Akron",
      "BYU","VCU","Wisconsin","Montana",
      "Saint Mary's","Vanderbilt","Alabama","Robert Morris"
  ]},
  { name: "Midwest", teams: [
      "Houston","SIUE","Gonzaga","Georgia",
      "Clemson","McNeese","Purdue","High Point",
      "Illinois","Xavier","Kentucky","Troy",
      "UCLA","Utah State","Tennessee","Wofford"
  ]},
  { name: "South",  teams: [
      "Auburn","Alabama St.","Louisville","Creighton",
      "Michigan","UC San Diego","Texas A&M","Yale",
      "Ole Miss","North Carolina","Iowa State","Lipscomb",
      "Marquette","New Mexico","Michigan State","Bryant"
  ]},
  { name: "West",   teams: [
      "Florida","Norfolk State","UConn","Oklahoma",
      "Memphis","Colorado St.","Maryland","Grand Canyon",
      "Missouri","Drake","Texas Tech","UNC Wilmington",
      "Kansas","Arkansas","St. John's","Omaha"
  ]}
];

const TEAM_NAME_FIXES = {
  "UConn" : "Connecticut",
  "Iowa State" : "Iowa St.",
  "Ole Miss" : "Mississippi",
  "Michigan State" : "Michigan St.",
  "Mississippi State" : "Mississippi St.",
  "Norfolk State" : "Norfolk St.",
  "Omaha" : "Nebraska Omaha",
  "SIUE" : "SIU Edwardsville",
  "McNeese" : "McNeese St.",
  "Utah State" : "Utah St."
}

const normalizeTeamName = (name) => TEAM_NAME_FIXES[name] || name;

const predictMatchup = async (team1, team2) => {
  const fixedTeam1 = normalizeTeamName(team1);
  const fixedTeam2 = normalizeTeamName(team2);

  try {
    const res = await fetch("h${process.env.REACT_APP_API_URL}/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team1: fixedTeam1, team2: fixedTeam2 }),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Prediction failed", err);
    return null;
  }
};


export default function Bracket() {
  const [selections, setSelections] = useState({});
  const showPlaceholder = () => alert("No functionality");
  // Build matchups per round: 64 -> 32 -> Sweet16 -> Elite8
  const generateRounds = (teams, regionIdx) => {
    const rounds = [];
    let current = teams;
    for (let r = 0; r < 4; r++) {
      const matchups = [];
      for (let i = 0; i < current.length; i += 2) {
        const id = `${regionIdx}-${r}-${i/2}`;
        matchups.push({ id, teams: [current[i]||"", current[i+1]||""] });
      }
      rounds.push(matchups);
      current = matchups.map(m => selections[m.id] || "");
    }
    return rounds;
  };
  // Get teams for Final Four dropdowns
  // Teams for Final Four
const getFinalFourTeams = (idx) => {
  if (idx === 0) {
    return [selections["0-3-0"], selections["1-3-0"]].filter(Boolean);
  } else {
    return [selections["2-3-0"], selections["3-3-0"]].filter(Boolean);
  }
};

// Teams for Championship
  const getChampionshipTeams = () => {
    return [selections["finalfour-0"], selections["finalfour-1"]].filter(Boolean);
  };
  const handleSelect = (id, team) => {
    setSelections(prev => ({ ...prev, [id]: team }));
  };

    return (
    <div className="min-h-screen bg-gray-50 p-8 overflow-auto">
      <h1 className="text-4xl font-bold text-center mb-12">2025 March Madness Bracket</h1>

      {/* Top Half */}
      <div className="flex justify-center items-start space-x-32">
        <RegionSection title="South" regionIdx={2} generateRounds={generateRounds} selections={selections} onSelect={handleSelect} />
        <RegionSection title="East" regionIdx={0} generateRounds={generateRounds} selections={selections} onSelect={handleSelect} flip />
      </div>

      {/* Final Four */}
       
      <div className="flex justify-center items-center space-x-16"> 
        {["South/East Winner", "West/Midwest Winner"].map((matchId, idx) => (
          <div key={matchId} className="flex flex-col items-center">
            <h2 className="font-semibold mb-2">FINAL FOUR</h2>
            <select
              className="w-48 h-12 border rounded shadow flex items-center"
              value={selections[`finalfour-${idx}`] || ''}
              onChange={(e) => handleSelect(`finalfour-${idx}`, e.target.value)}
            >
              <option disabled value="">Select Winner</option>
              {getFinalFourTeams(idx).map(team => (
                <option key={team}>{team}</option>
              ))}
            </select>
            <button
              onClick={async () => {
                const teams = getFinalFourTeams(idx);
                if (teams.length === 2) {
                  const prediction = await predictMatchup(teams[0], teams[1]);
                  if (prediction?.winner) {
                    handleSelect(`finalfour-${idx}`, prediction.winner);
                  } else {
                    alert("Prediction failed.");
                  }
                } else {
                  alert("Two teams must be selected to predict.");
                }
              }}
              className="ml-2 px-2 py-1 text-sm bg-blue-200 rounded hover:bg-blue-300"
            >
              P
            </button>
          </div>
        ))}
      </div>

      {/* Championship */}
      
      <div className="flex flex-col items-center "> 
        <h2 className="text-2xl font-semibold mb-4 my-6">CHAMPIONSHIP GAME</h2>
        <div className="w-72 h-20 border rounded shadow flex items-center justify-center">
          <select
            className="w-full h-full text-xl text-center"
            value={selections["champion"] || ''}
            onChange={(e) => handleSelect("champion", e.target.value)}
          >
            <option disabled value="">Select Winner</option>
            {getChampionshipTeams().map(team => (
              <option key={team}>{team}</option>
            ))}
          </select>
          <button
            onClick={async () => {
              const teams = getChampionshipTeams();
              if (teams.length === 2) {
                const prediction = await predictMatchup(teams[0], teams[1]);
                if (prediction?.winner) {
                  handleSelect("champion", prediction.winner);
                } else {
                  alert("Prediction failed.");
                }
              } else {
                alert("Two teams must be selected to predict.");
              }
            }}
            className="ml-2 px-2 py-1 text-sm bg-blue-200 rounded hover:bg-blue-300"
          >
            P
          </button>

        </div>
        {/* Dynamically loaded Champion Logo */}
        {selections["champion"] && (
          <div className="mt-4 w-32 h-32 border rounded-full bg-gray-100 flex justify-center items-center">
          <img
            src={`/resources/logos/${selections["champion"].toLowerCase().replace(/[\s.&'-]/g, '')}.png`}
            alt={`${selections["champion"]} logo`}
            className="object-contain"
          />
        </div>
      )}
      </div>

      {/* Bottom Half */}
      <div className="flex justify-center items-start space-x-32">
        <RegionSection title="West" regionIdx={3} generateRounds={generateRounds} selections={selections} onSelect={handleSelect} />
        <RegionSection title="Midwest" regionIdx={1} generateRounds={generateRounds} selections={selections} onSelect={handleSelect} flip />
      </div>
    </div>
  );
}

function RegionSection({ title, regionIdx, generateRounds, selections, onSelect, flip }) {
    const showPlaceholder = () => alert("No functionality");
    const roundsData = generateRounds(regions[regionIdx].teams, regionIdx);
    const columns = roundsData.map((matchups, r) => ({ matchups, round: r }));
    const displayCols = flip ? columns.slice().reverse() : columns;

  
    const boxHeightRem = 2.5;
    const marginYClass = 'my-6'; 
    const marginRem = { 'my-1': 0.25, 'my-2': 0.5, 'my-3': 0.75, 'my-4': 1, 'my-5': 1.25, 'my-6': 1.5 }[marginYClass] || 0.5;
    const constantFactor = (boxHeightRem / 2) + marginRem;
    const standardHorizontalMargin = '4rem';
    const increasedHorizontalMargin = '4rem'; 
    


    return (
        <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            <div className="flex items-start">
                {displayCols.map(({ matchups, round }, colIdx) => { // Use colIdx for layout logic

                  
                    let marginLeftValue = '0rem';
                    if (flip) {
                        // Flipped: Display order is R3, R2, R1, R0 (colIdx 0, 1, 2, 3)
                        // Apply margin to the left of columns R2, R1, R0
                        if (colIdx === 1) { // Margin before R2 column
                            marginLeftValue = standardHorizontalMargin;
                        } else if (colIdx === 2) { // Margin before R1 column
                            marginLeftValue = increasedHorizontalMargin;
                        } else if (colIdx === 3) { // Margin before R0 column
                            marginLeftValue = standardHorizontalMargin;
                        }
                        // colIdx 0 (R3) has no left margin needed
                    } else {
                        // Not Flipped: Display order is R0, R1, R2, R3 (colIdx 0, 1, 2, 3)
                        // Apply standard margin to the left of columns R1, R2, R3
                        if (colIdx > 0) {
                            marginLeftValue = standardHorizontalMargin;
                        }
                    }

                    return (
                        <div
                            key={`${regionIdx}-${round}`} 
                            className="flex flex-col"
                            style={{
                                marginLeft: marginLeftValue 
                            }}
                        >
                            {matchups.map((m, idx) => {
                                const verticalPadding = Math.max(0, constantFactor * (2 ** round - 1));
                                return (
                                    <div
                                        key={m.id}
                                        className={marginYClass}
                                        style={{ padding: `${verticalPadding}rem 0` }}
                                    >
                                        <div className={`w-40 h-10 border rounded shadow flex items-center`}>
                                            {/* Elements on the LEFT */}
                                            {!flip && round === 0 && ( <span className="w-8 font-semibold text-center text-xs whitespace-pre-line leading-tight mr-1">{SEED_ORDER[idx * 2]}</span> )}
                                            
                                            {/* Select (Middle) */}
                                            <select className="flex-1 h-full text-center text-sm appearance-none bg-white border-none" value={selections[m.id] || ''} onChange={(e) => onSelect(m.id, e.target.value)}>
                                                <option disabled value="" className="text-gray-500">{m.teams[0] || 'TBD'} | {m.teams[1] || 'TBD'}</option>
                                                {m.teams[0] && <option value={m.teams[0]}>{m.teams[0]}</option>}
                                                {m.teams[1] && <option value={m.teams[1]}>{m.teams[1]}</option>}
                                            </select>
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                const [team1, team2] = m.teams;
                                                if (team1 && team2) {
                                                  const prediction = await predictMatchup(team1, team2);
                                                  if (prediction?.winner) {
                                                    onSelect(m.id, prediction.winner);
                                                  } else {
                                                    alert("Prediction failed. Check backend.");
                                                  }
                                                }
                                              }}
                                              className="ml-2 px-2 py-0.5 text-xs bg-blue-200 rounded hover:bg-blue-300"
                                            >
                                              P
                                            </button>

                                            {/* Elements on the RIGHT */}
                                            
                                            {flip && round === 0 && ( <span className="w-8 font-semibold text-center text-xs whitespace-pre-line leading-tight ml-1">{SEED_ORDER[idx * 2]}</span> )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


//  Final Four slots
function Connector({ title, rows }) {
  return (
    <div className="flex flex-col items-center">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className={`grid grid-rows-${rows} gap-y-32`}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="w-32 h-8 border" />
        ))}
      </div>
    </div>
  );
}

// Layout utilities
function gridRows(r) {
  return ['grid-rows-16', 'grid-rows-8', 'grid-rows-4', 'grid-rows-2'][r];
}

function gridGap(r) {
  return ['gap-y-4', 'gap-y-8', 'gap-y-16', 'gap-y-32'][r];
}
