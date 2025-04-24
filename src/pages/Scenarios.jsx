// src/pages/Scenarios.jsx
import React, { useEffect, useState } from "react";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@radix-ui/react-tooltip";
import GraphEditor from "../components/GraphEditor";


const scenarioButtons = [
  { id: "SS1", label: "SS1", description: "Bac de stockage et ses équipements", top: "26%", left: "87%", file: "/Scenario/DG-SS1.json" },
  { id: "SS2", label: "SS2", description: "La pompe et le poste de chargement", top: "50%", left: "55%", file: "/Scenario/DG-SS2.json" },
  { id: "SS3", label: "SS3", description: "Navire citernes et ses équipements", top: "40%", left: "12%", file: "/Scenario/DG-SS3.json" },
  { id: "SS4", label: "SS4", description: "Opérateur", top: "80%", left: "50%", file: "/Scenario/DG-SS4.json" },
  { id: "SS5-1", label: "SS5", description: "Environnement", top: "16%", left: "8%", file: "/Scenario/DG-SS5.json" },
  { id: "SS5-2", label: "SS5", description: "Environnement", top: "95%", left: "90%", file: "/Scenario/DG-SS5.json" },
];

const notationTable = [
  {
    sousSystem: "SS1:\n( Bac de stockage et ses équipements) ",
    node: "DV = Dysfonctionnement des Vannes\nDP = Diversement de Produit\nIc = Incendie\nEx = Explosion\nDg = Dégâts",
    relation: "Ft = Fuite\nFH = Flux thermique\nPj = Projectiles",
  },
  {
    sousSystem: "SS2:\n( La pompe et le poste de chargement )",
    node: "Ch = Choc\nMB = Mauvais Branchement\nDP = Diversement de Produit\nIc = Incendie\nEx = Explosion\nDg = Dégâts",
    relation: "RC = Rupture de Canalisation\nFH = Flux thermique\nPj = Projectiles",
  },
  {
    sousSystem: "SS3:\n( Navire citernes et ses équipements )",
    node: "DN = Déséquilibre du Navire\nFC = Fissure de la coque\nDP = Diversement de Produit\nIc = Incendie\nEx = Explosion\nDg = Dégâts",
    relation: "MN = Mouvement du Navire\nFt = Fuite\nFH = Flux thermique\nPj = Projectiles",
  },
  {
    sousSystem: "SS4:\n( Opérateur )",
    node: "MF = Manque de Formation\nFS = Fatigue & stresse\nANC = Action Non Conforme\nMB = Mauvais Branchement",
    relation: "EH = Erreur Humaine\nFH = Flux thermique",
  },
  {
    sousSystem: "SS5:\n( Environnement )",
    node: "TO = Tempête&Orage\nGV = Grandes Vagues",
    relation: "MP = Mer Perturbée",
  },
];

const zones = {
  ss1: ["DV", "DP", "Ic", "Ex", "Dg"],
  ss2: ["Ch", "MB", "DP", "Ic", "Ex", "Dg"],
  ss3: ["DN", "FC", "DP", "Ic", "Ex", "Dg"],
  ss4: ["MF", "FS", "ANC", "MB"],
  ss5: ["TO", "GV"],
};

const natureMap = {
  MF: "Humain",
  DV: "Technique",
  DN: "Technique/organisationnel",
  DP: "Technique",
  Ic: "Humain",
  Ex: "Technique",
  Dg: "Technique",
  Ch: "Technique",
  MB: "Humain",
  FC: "Technique",
  FS: "Humain",
  ANC: "Humain",
  TO: "Naturel",
  GV: "Naturel",

};

// Function to extract data from the loaded scenario
const calculateMatrixFromScenario = (scenarioFileName, elements) => {
  // 1. Get all node IDs from elements
  const nodeIds = elements
    .filter((el) => el.group === "nodes")
    .map((el) => el.data.id);

  if (nodeIds.length === 0) return;

  // 2. Get nature from the first node
  const firstNode = nodeIds[0];
  const nature = natureMap[firstNode] || "Inconnu";

  // 3. Count domino effects (nodes - 1) if "Dg" exists
  const dominoEffects = nodeIds.includes("Dg") ? nodeIds.length - 1 : nodeIds.length;

  // 4. Determine impacted zones
  const impactedZones = new Set();
  nodeIds.forEach((node) => {
    for (const [zone, zoneNodes] of Object.entries(zones)) {
      if (zoneNodes.includes(node)) {
        impactedZones.add(zone);
      }
    }
  });

  // 5. Build the matrix row
  const row = {
    scenario: scenarioFileName,
    nature,
    dominoEffects,
    impactedZones: impactedZones.size,
  };

  return row;
};


// Function to calculate danger value based on the number of nodes and affected zones
const calculateDangerValue = (affectedNodes, affectedZones) => {
  const sum = affectedNodes + affectedZones;
  if (sum < 4) return "white";
  if (sum >= 4 && sum <= 6) return "yellow";
  return "red";
};

// G = gravité : fonction (effets dominos + zones impactées) → [1…4]
const computeG = (dominoEffects, impactedZones) => {
  const sum = dominoEffects + impactedZones;
  if (sum <= 2) return 1;
  if (sum <= 4) return 2;
  if (sum <= 6) return 3;
  return 4;
};

// F = fréquence : nombre d’effets dominos plafonné à 4
const computeF = (dominoEffects) => Math.min(dominoEffects, 4);
// Score de criticité (produit G×F)
const computeScore = (dominoEffects, impactedZones) => {
  const G = computeG(dominoEffects, impactedZones);
  const F = computeF(dominoEffects);
  return G * F;
};


const Scenarios = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const [graphVisible, setGraphVisible] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [dangerMatrix, setDangerMatrix] = useState([]);
  const [analyzedMatrix, setAnalyzedMatrix] = useState(null);
  const [visibleTable, setVisibleTable] = useState(null);
  const [scenarioData, setScenarioData] = useState(null);
  const [dbScenarios, setDbScenarios] = useState([]);
const [selectedDbId, setSelectedDbId] = useState("");

// Fetch scenarios list from DB on mount
useEffect(() => {
  fetch("http://localhost:3001/api/scenarios")
    .then(res => res.json())
    .then(setDbScenarios)
    .catch(err => console.error("❌ Failed to fetch scenarios from DB", err));
}, []);


    
    
  const loadScenario = async (file) => {
    try {
      const response = await fetch(file);
      if (!response.ok) throw new Error("File not found");
      const data = await response.json();
      setSelectedScenario(data);  // Directly pass the loaded data
      setGraphVisible(true);
    } catch (error) {
      console.error("Error loading scenario:", error);
      alert("Erreur lors du chargement du scénario !");
    }
  }; 
;

const getRiskColor = (score) => {
  if (score <= 3) return "#a8e6cf";       // Vert (faible)
  if (score <= 6) return "#fff59d";       // Jaune (modéré)
  if (score <= 12) return "#ff8a65";      // Rouge normal (élevé)
  return "#d32f2f";                       // Rouge foncé (très critique)
};


  const calculateDangerForZones = (data) => {
    const scenarioName = data?.scenario || "Scénario importé";
    const matrixRow = calculateMatrixFromScenario(scenarioName, data.elements);
  
    if (matrixRow) {
      setDangerMatrix(prev => [...prev, matrixRow]);

    } else {
      setDangerMatrix([]);
    }
  };
  // à placer juste après vos imports
// 1) Classification de l’intensification selon le nombre de SSi impactés
const classifyIntensification = (impactedZones, scenario) => {
  if (impactedZones <= 1)      return 'Moins intense';  // <— tous les cas à 1 ou 0 SSi
  if (impactedZones === 2)     return 'Moins intense';
  if (impactedZones === 3)     return 'Intense';
  if (impactedZones === 4)     return scenario === 'S11' ? 'Très intense' : 'Intense';
  if (impactedZones === 5)     return 'Très intense';
  return 'Intense';
};


// 2) Valeurs de bars BT/BU pour **toutes** les combinaisons 2,3,4,5 SSi
const barrierGrid = {
  'Moins intense': {
    1: { BT: 0, BU: 1 },
    2: { BT: 1, BU: 1 },
    3: { BT: 2, BU: 1 },
    4: { BT: 2, BU: 1 },
    5: { BT: 2, BU: 1 },
  },
  'Intense': {
    2: { BT: 2, BU: 1 },
    3: { BT: 2, BU: 1 },
    4: { BT: 3, BU: 2 },
    5: { BT: 3, BU: 2 },
  },
  'Très intense': {
    2: { BT: 3, BU: 2 },
    3: { BT: 3, BU: 2 },
    4: { BT: 4, BU: 5 },
    5: { BT: 5, BU: 7 },
  }
};

// Replace existing classifyIntensification with:
const getTotalBarriers = (p, s) => p * s;

const riskLevels = {
  'Faible': { min: 1, max: 3, color: '#4CAF50' },      // Green
  'Modéré': { min: 4, max: 6, color: '#FFEB3B' },     // Yellow
  'Élevé': { min: 7, max: 12, color: '#F44336' },     // Red
  'Extrême': { min: 13, max: 16, color: '#B71C1C' },  // Dark Red
};

// Helper function to get risk level
const getRiskLevel = (value) => {
  if (value >= 1 && value <= 3) return 'Faible';
  if (value >= 4 && value <= 6) return 'Modéré';
  if (value >= 7 && value <= 12) return 'Élevé';
  if (value >= 13 && value <= 16) return 'Extrême';
  return 'Inconnu';
};
  const calculateDangerValue = (nodes, zones) => {
    // Placeholder logic: danger = affectedNodes + affectedZones * 2
    return nodes + zones * 2;
  };

  const toggleShowDetails = () => setShowDetails((prev) => !prev);

  return (
    <div style={{ height: "calc(100vh - 60px)", padding: "10px" }}>
      <h2>Create / View Scenario Graph</h2>

      <div style={{ position: "relative", width: "100%", maxWidth: "800px", margin: "0 auto" }}>
        <img
          src="./scenario-map.png"
          alt="Scenario Map"
          style={{ width: "100%", height: "auto", display: "block" }}
        />

        <TooltipProvider>
          {scenarioButtons.map(({ id, label, description, top, left, file }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => {
                    const confirmLoad = window.confirm(`${label} : ${description}\n\nVoulez-vous ouvrir le scénario lié à cette zone ?`);
                    if (confirmLoad) loadScenario(file);
                  }}
                  style={{
                    position: "absolute",
                    top,
                    left,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "rgba(255, 255, 255, 0.5)",
                    border: "1px solid #333",
                    borderRadius: "4px",
                    padding: "5px 10px",
                    cursor: "pointer",
                  }}
                >
                  🔍 {label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{description}</TooltipContent>
            </Tooltip>
          ))}
        </TooltipProvider>
      </div>

      <div style={{ justifyContent: "flex-end", display: "flex", gap: "10px" }}>
        <button
          onClick={() =>
            setVisibleTable((prev) => (prev === "details" ? null : "details"))
          }
          style={{ padding: "8px 12px" }}
        >
          {visibleTable === "details" ? "Masquer les détails" : "Afficher les détails"}
        </button>
        <button
  onClick={() => {
    if (analyzedMatrix) {
      setDangerMatrix([analyzedMatrix]);
      setVisibleTable("analysis");
    } else {
      alert("Aucun scénario chargé !");
    }
  }}
>
  {visibleTable === "analysis"
    ? "Masquer l’analyse du scénario"
    : "Analyser le scénario"}
</button>



      </div>


      <div style={{ display: "flex", width: "100%", height: "calc(100% - 80px)" }}>
        {/* Graph Editor - 60% width */}
        <div
          style={{
          flex: "0 0 60%",
          marginRight: "20px",
          minHeight: "300px", // ensure graph area is always shown
          }}
        >
       {graphVisible && (
                <GraphEditor
          scenarioData={selectedScenario}
          dbScenarios={dbScenarios}
          selectedDbId={selectedDbId}
          setSelectedDbId={setSelectedDbId}
          onAnalyze={(row) => {
                 setAnalyzedMatrix(row);
                 setDangerMatrix([row]);
                 setVisibleTable("analysis");
               }}
        />




          )}
        </div>

         {/* Right Side Table Area - 40% width */}
        <div style={{ flex: "0 0 40%", overflowY: "auto" }}>
          {/* Details Table */}
            {visibleTable === "details" && (
            <table
              style={{
              borderCollapse: "collapse",
              width: "100%",
              minWidth: "400px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid black", paddingLeft: "8px"  }}>Sous Système</th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>Noeuds</th>
                  <th style={{ border: "1px solid black", padding: "8px" }}>Flux de Danger</th>
                </tr>
              </thead>
              <tbody>
                {notationTable.map((entry, index) => (
                  <tr key={index}>
                  <td style={{ border: "1px solid black", paddingLeft: "8px", whiteSpace: "pre-wrap" }}>
                  {entry.sousSystem.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
                 </td>
                 <td style={{ border: "1px solid black", padding: "8px", whiteSpace: "pre-wrap" }}>
                    {entry.node.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                    ))}
                 </td>
                 <td style={{ border: "1px solid black", padding: "8px", whiteSpace: "pre-wrap" }}>
                  {entry.relation.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                 </td>
                 </tr>
               ))}
             </tbody>
           </table>
            )}

<div style={{ width: "100%", maxWidth: "100vw", overflowX: "auto", padding: "20px" }}>

{visibleTable === "analysis" && dangerMatrix.length > 0 && (
  <div style={{ marginTop: "20px" }}>
    <h3>Matrice de danger</h3>
    <table border="1" cellPadding="10">
      <thead>
        <tr>
          <th>Scénario</th>
          <th>Nature</th>
          <th>Effets domino</th>
          <th>SSi impactés</th>
        </tr>
      </thead>
      <tbody>
        {dangerMatrix.map((entry, index) => (
          <tr key={index}>
            <td>{entry.scenario}</td>
            <td>{entry.nature}</td>
            <td>{entry.dominoEffects}</td>
            <td>{entry.impactedZones}</td>
          </tr>
        ))}
      </tbody>
    </table>
   
    <h3>Grille de négociation des objectifs de sécurité</h3>
<table border="1" cellPadding="8">
  <thead>
    <tr>
      <th>Intensification \\ SSi</th>
      <th>1 SSi</th>
      <th>2 SSi</th>
      <th>3 SSi</th>
      <th>4 SSi</th>
      <th>5 SSi</th>
    </tr>
  </thead>
  <tbody>
    {['Moins intense', 'Intense', 'Très intense'].map(level => (
      <tr key={level}>
        <td><strong>{level}</strong></td>
        {[1, 2, 3, 4, 5].map(ss => {
          const cell = barrierGrid[level]?.[ss];
          const loaded = dangerMatrix[0]; // scénario en cours
          const isMatch =
            level === classifyIntensification(loaded.impactedZones, loaded.scenario) &&
            loaded.impactedZones === ss;

          // Couleur de fond selon l'intensité
          let baseColor = 'transparent';
          if (level === 'Moins intense') baseColor = '#d0f0c0'; // vert clair
          else if (level === 'Intense') baseColor = '#fff59d'; // jaune
          else if (level === 'Très intense') baseColor = '#ef9a9a'; // rouge clair

          // Si c’est le bon scénario, ajouter un overlay bleu
          const finalColor = isMatch ? '#e0f7fa' : baseColor;

          return (
            <td key={ss} style={{ backgroundColor: finalColor }}>
              {cell ? `${cell.BT} BT + ${cell.BU} BU` : '—'}
              {isMatch && <div><em>({loaded.scenario})</em></div>}
            </td>
          );
        })}
      </tr>
    ))}
  </tbody>
</table>


<h3>Grille de criticité 4×4</h3>
    <table border="1" cellPadding="8">
      <thead>
        <tr>
          <th></th>
          {[1,2,3,4].map(f => <th key={f}>F = {f}</th>)}
        </tr>
      </thead>
      <tbody>
  {[4, 3, 2, 1].map((g) => (
    <tr key={g}>
      <td><strong>G = {g}</strong></td>
      {[1, 2, 3, 4].map((f) => {
        const Gcur = computeG(analyzedMatrix.dominoEffects, analyzedMatrix.impactedZones);
        const Fcur = computeF(analyzedMatrix.dominoEffects);
        const score = g * f;
        const isHighlight = Gcur === g && Fcur === f;
        return (
          <td
            key={f}
            style={{
              backgroundColor: isHighlight ? "#e0f7fa" : getRiskColor(score), // noir pour la sélection
              color: isHighlight ? "black" : "#000", // texte blanc si sélectionné
              textAlign: "center",
              fontWeight: isHighlight ? "bold" : "normal",
              border: "1px solid #ccc",
            }}
          >
            <div>{score}</div>
            {isHighlight && <div><em>{analyzedMatrix.scenario}</em></div>}
          </td>
        );
      })}
    </tr>
  ))}
</tbody>


    </table>


  </div>

)}


    </div>
   </div>
   </div>
  </div>
   
  );
};


export default Scenarios;
