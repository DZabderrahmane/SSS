// --- ✅ ANALYSIS FIX APPLIED ---
import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";

const GraphEditor = ({
  scenarioData,
  dbScenarios,
  selectedDbId,
  setSelectedDbId,
  onAnalyze,
}) => {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const suggestionsRef = useRef({});
  const fileInputRef = useRef(null);

  const [nodeId, setNodeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [relation, setRelation] = useState("");
  const [history, setHistory] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [allNodeIds, setAllNodeIds] = useState([]);
  const [relationsList, setRelationsList] = useState(["Ft", "FH", "Pj", "RC", "MN", "EH", "MP"]);

  const [showNodeSuggestions, setShowNodeSuggestions] = useState(false);
  const [showRelationSuggestions, setShowRelationSuggestions] = useState(false);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  const computeMatrixRow = (nodeIds, scenarioName = "Scénario importé") => {
    const impactedZones = new Set();
  
    nodeIds.forEach((node) => {
      for (const [zone, zoneNodes] of Object.entries({
        ss1: ["DV", "DP", "Ic", "Ex", "Dg"],
        ss2: ["Ch", "MB", "DP", "Ic", "Ex", "Dg"],
        ss3: ["DN", "FC", "DP", "Ic", "Ex", "Dg"],
        ss4: ["MF", "FS", "ANC", "MB"],
        ss5: ["TO", "GV"],
      })) {
        if (zoneNodes.includes(node)) impactedZones.add(zone);
      }
    });
  
    const firstNode = nodeIds[0];
    const nature = {
      MF: "Humain", DV: "Technique", DN: "Technique/organisationnel", DP: "Technique",
      Ic: "Humain", Ex: "Technique", Dg: "Technique", Ch: "Technique", MB: "Humain",
      FC: "Technique", FS: "Humain", ANC: "Humain", TO: "Naturel", GV: "Naturel",
    }[firstNode] || "Inconnu";
  
    return {
      scenario: scenarioName,
      nature,
      dominoEffects: nodeIds.includes("Dg") ? nodeIds.length - 1 : nodeIds.length,
      impactedZones: impactedZones.size,
    };
  };
  











  const analyzeGraph = () => {
    if (!onAnalyze || !cyRef.current) return;

    const elements = cyRef.current.elements();
    const nodeIds = elements.filter((el) => el.group() === "nodes").map((el) => el.data("id"));
    if (!nodeIds.length) return;

    const impactedZones = new Set();
    nodeIds.forEach((node) => {
      for (const [zone, zoneNodes] of Object.entries({
        ss1: ["DV", "DP", "Ic", "Ex", "Dg"],
        ss2: ["Ch", "MB", "DP", "Ic", "Ex", "Dg"],
        ss3: ["DN", "FC", "DP", "Ic", "Ex", "Dg"],
        ss4: ["MF", "FS", "ANC", "MB"],
        ss5: ["TO", "GV"],
      })) {
        if (zoneNodes.includes(node)) impactedZones.add(zone);
      }
    });

    const firstNode = nodeIds[0];
    const nature = {
      MF: "Humain", DV: "Technique", DN: "Technique/organisationnel", DP: "Technique",
      Ic: "Humain", Ex: "Technique", Dg: "Technique", Ch: "Technique", MB: "Humain",
      FC: "Technique", FS: "Humain", ANC: "Humain", TO: "Naturel", GV: "Naturel",
    }[firstNode] || "Inconnu";

    const matrixRow = {
      scenario: "Scénario importé",
      nature,
      dominoEffects: nodeIds.includes("Dg") ? nodeIds.length - 1 : nodeIds.length,
      impactedZones: impactedZones.size,
    };

    onAnalyze(matrixRow);
  };

  useEffect(() => {
    cyRef.current = cytoscape({
      container: containerRef.current,
      style: [
        { selector: "node", style: { "background-color": "#0074D9", label: "data(id)", "font-size": "12px" } },
        { selector: "edge", style: { width: 2, "line-color": "#333", "target-arrow-color": "#333", "curve-style": "bezier", "target-arrow-shape": "triangle", label: "data(relation)", "font-size": "10px", "text-vertical-alignment": "middle", "text-margin-y": -10 } },
      ],
      layout: { name: "grid", rows: 1 },
    });

    const cy = cyRef.current;
    cy.on("cxttap", "node", (evt) => setSelectedElement(evt.target) || setContextMenu({ position: evt.position, type: "node" }));
    cy.on("cxttap", "edge", (evt) => setSelectedElement(evt.target) || setContextMenu({ position: evt.position, type: "edge" }));
  }, []);

  useEffect(() => {
    if (!scenarioData?.elements) return;
    cyRef.current?.elements().remove();
    const loadedNodeIds = [];
    scenarioData.elements.forEach((elem) => {
      const { position, style, ...rest } = elem;
      const addedElems = cyRef.current.add({ ...rest, ...(position && { position }) });
      if (style) {
        addedElems.forEach((el) => {
          if (el.group() === "nodes") {
            style.shape && el.style("shape", style.shape);
            style["background-color"] && el.style("background-color", style["background-color"]);
          } else {
            style["line-color"] && el.style("line-color", style["line-color"]);
          }
        });
      }
      if (elem.group === "nodes") loadedNodeIds.push(rest.data.id);
    });
    setAllNodeIds(loadedNodeIds);
    setTimeout(() => {
      cyRef.current.resize();
      cyRef.current.fit();
      analyzeGraph(); // ✅ automatic analysis on load
    }, 100);
  }, [scenarioData]);



  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenu && !e.target.closest(".context-menu") && 
        !Object.values(suggestionsRef.current).some((ref) => ref && ref.current && ref.current.contains(e.target))
      ) {
        setContextMenu(null);
        setShowNodeSuggestions(false);
        setShowFromSuggestions(false);
        setShowToSuggestions(false);
        setShowRelationSuggestions(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

      // For DB dropdown
 
      

    

  const addNode = () => {
    if (!nodeId || cyRef.current.getElementById(nodeId).length > 0) {
      alert("Invalid or duplicate node ID");
      return;
    }
    const newNode = { group: "nodes", data: { id: nodeId } };
    cyRef.current.add(newNode);
    setAllNodeIds((prev) => [...prev, nodeId]);
    setHistory((prev) => [...prev, newNode]);
    cyRef.current.layout({ name: "cose" }).run();
    setNodeId("");
  };

  const addEdge = () => {
    const cy = cyRef.current;
    if (!cy.getElementById(fromId).length || !cy.getElementById(toId).length) {
      alert("Invalid source or target ID");
      return;
    }
    const edgeId = `${fromId}_${toId}`;
    if (cy.getElementById(edgeId).length > 0) {
      alert("Edge already exists");
      return;
    }
    const newEdge = {
      group: "edges",
      data: {
        id: edgeId,
        source: fromId,
        target: toId,
        relation: relation,
      },
    };
    cy.add(newEdge);
    setHistory((prev) => [...prev, newEdge]);
    setFromId("");
    setToId("");
    setRelation("");
  };

  const undoLast = () => {
    const last = history.pop();
    if (!last) return;
    cyRef.current.getElementById(last.data.id).remove();
    if (last.group === "nodes") {
      setAllNodeIds((prev) => prev.filter((id) => id !== last.data.id));
    }
    setHistory([...history]);
  };

  const clearGraph = () => {
    cyRef.current.elements().remove();
    setAllNodeIds([]);
    setHistory([]);
  };
  // —— Save to MongoDB ——
  const saveToDb = async () => {
    // collect elements & positions
    const elementsWithPositions = cyRef.current.elements().map(elem => {
      const base = { group: elem.group(), data: elem.data() };
      if (elem.isNode()) {
        return {
          ...base,
          position: elem.position(),
          style: {
            shape: elem.style("shape"),
            "background-color": elem.style("background-color"),
          }
        };
      }
      return { ...base, style: { "line-color": elem.style("line-color") } };
    });
    const graphData = { elements: elementsWithPositions };
  
    // ask for name
    const name = prompt("Name for this scenario:", "Scenario_" + Date.now());
    if (!name) return;
  
    const blob = new Blob([JSON.stringify(graphData)], { type: "application/json" });
    const form = new FormData();
    form.append("name", name);
    form.append("attachment", blob, "graph.json");
  
    try {
      const res = await fetch("http://localhost:3001/api/save-scenario", {
        method: "POST",
        body: form
      });
      if (!res.ok) throw new Error(await res.text());
      alert("✅ Saved to database!");
    } catch (err) {
      console.error(err);
      alert("❌ DB save failed: " + err.message);
    }
  };
  
  // —— Save-As File Dialog (File System Access API w/ fallback) ——
  const saveToFile = async () => {
    const elementsWithPositions = cyRef.current.elements().map(elem => {
      const base = { group: elem.group(), data: elem.data() };
      if (elem.isNode()) {
        return {
          ...base,
          position: elem.position(),
          style: {
            shape: elem.style("shape"),
            "background-color": elem.style("background-color"),
          }
        };
      }
      return { ...base, style: { "line-color": elem.style("line-color") } };
    });
    const jsonStr = JSON.stringify({ elements: elementsWithPositions }, null, 2);
  
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `graph_${Date.now()}.json`,
          types: [{
            description: "JSON Files",
            accept: { "application/json": [".json"] }
          }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonStr);
        await writable.close();
        alert("✅ File saved!");
      } catch (err) {
        console.error(err);
        alert("❌ Save-as failed: " + err.message);
      }
    } else {
      // fallback for non‐Chromium browsers
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `graph_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      alert("✅ Download started!");
    }
  };
  
 // —— Load a specific scenario from MongoDB by its ID ——
 const loadFromDb = async () => {
  if (!selectedDbId) {
    return alert("Please pick a scenario in the dropdown first.");
  }
  try {
    const res = await fetch(`http://localhost:3001/api/load-scenario/${selectedDbId}`);
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const bufObj = data.attachment?.data;
    const byteArray = Array.isArray(bufObj) ? bufObj : bufObj.data;
    const uintArray = new Uint8Array(byteArray);
    const jsonStr = new TextDecoder().decode(uintArray);
    const parsed = JSON.parse(jsonStr);

    // Clear old elements & re-add
    cyRef.current.elements().remove();
    const newIds = [];
    parsed.elements.forEach((elem) => {
      const { position, style, ...rest } = elem;
      const added = cyRef.current.add({ ...rest, ...(position && { position }) });
      if (style) {
        added.forEach((el) => {
          if (el.group() === "nodes") {
            style.shape && el.style("shape", style.shape);
            style["background-color"] && el.style("background-color", style["background-color"]);
          } else {
            style["line-color"] && el.style("line-color", style["line-color"]);
          }
        });
      }
      if (elem.group === "nodes") newIds.push(rest.data.id);
    });
    setAllNodeIds(newIds);
    if (typeof onAnalyze === "function") {
      const matrixRow = computeMatrixRow(newIds, "Chargé depuis DB");
      onAnalyze(matrixRow);
    }
    
    setTimeout(() => {
      cyRef.current.resize();
      cyRef.current.fit();
    }, 100);
    alert("✅ Loaded from DB!");
  } catch (err) {
    console.error("DB load error:", err);
    alert("❌ Failed to load from DB");
  }
};

const loadGraph = (event) => {
const file = event.target.files[0];
if (!file) return;

const reader = new FileReader();
reader.onload = (e) => {
  try {
    const json = JSON.parse(e.target.result);
    const elements = json.elements || json;
    const loadedNodeIds = [];

    elements.forEach((elem) => {
      const { position, style, ...rest } = elem;

      // Add the element first
      const addedElems = cyRef.current.add({
        ...rest,
        ...(position && { position }),
      });

      // Now apply style **only if it exists**
      if (style) {
        addedElems.forEach(el => {
          if (el.group() === 'nodes') {
            if (style.shape) el.style('shape', style.shape);
            if (style['background-color']) el.style('background-color', style['background-color']);
          } else if (el.group() === 'edges') {
            if (style['line-color']) el.style('line-color', style['line-color']);
          }
        });
      }

      if (elem.group === "nodes") {
        loadedNodeIds.push(rest.data.id);
      }
    });

    setAllNodeIds(loadedNodeIds);
    if (typeof onAnalyze === "function") {
      const matrixRow = computeMatrixRow(loadedNodeIds, "Chargé depuis fichier");
      onAnalyze(matrixRow);
    }
    
    setTimeout(() => {
      cyRef.current.resize();
      cyRef.current.fit();
    }, 100);
  } catch (err) {
    console.error(err);
    alert("Failed to load the graph. Make sure the file is valid.");
  }
};
reader.readAsText(file);
};


  
  const filterSuggestions = (value, suggestionsList) => {
    return suggestionsList.filter((id) => id.toLowerCase().includes(value.toLowerCase()));
  };
  

  return (
    <div style={{ height: "100%", width: "1000px", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: 8, background: "#f5f5f5", display: "flex", gap: 6, flexWrap: "wrap" }}>
        {/* Node ID */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            onFocus={() => setShowNodeSuggestions(true)}
            placeholder="Node ID"
            style={{ width: "100px" }}
          />
          {showNodeSuggestions && (
            <ul ref={suggestionsRef.nodeId} style={{ position: "absolute", background: "white", border: "1px solid #ccc", width: "100px", zIndex: 10 }}>
              {filterSuggestions(nodeId, allNodeIds).map((id) => (
                <li key={id} onClick={() => { setNodeId(id); setShowNodeSuggestions(false); }} style={{ padding: "4px", cursor: "pointer" }}>
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button onClick={addNode}>Add Node</button>

        {/* From ID */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={fromId}
            onChange={(e) => setFromId(e.target.value)}
            onFocus={() => setShowFromSuggestions(true)}
            placeholder="From"
            style={{ width: "100px" }}
          />
          {showFromSuggestions && (
            <ul ref={suggestionsRef.fromId} style={{ position: "absolute", background: "white", border: "1px solid #ccc", width: "100px", zIndex: 10 }}>
              {filterSuggestions(fromId, allNodeIds).map((id) => (
                <li key={id} onClick={() => { setFromId(id); setShowFromSuggestions(false); }} style={{ padding: "4px", cursor: "pointer" }}>
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* To ID */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={toId}
            onChange={(e) => setToId(e.target.value)}
            onFocus={() => setShowToSuggestions(true)}
            placeholder="To"
            style={{ width: "100px" }}
          />
          {showToSuggestions && (
            <ul ref={suggestionsRef.toId} style={{ position: "absolute", background: "white", border: "1px solid #ccc", width: "100px", zIndex: 10 }}>
              {filterSuggestions(toId, allNodeIds).map((id) => (
                <li key={id} onClick={() => { setToId(id); setShowToSuggestions(false); }} style={{ padding: "4px", cursor: "pointer" }}>
                  {id}
                </li>
              ))}
            </ul>
          )}
        </div>
        

        {/* Relation */}
<div style={{ position: "relative" }} ref={suggestionsRef.relation}>
  <input
    type="text"
    value={relation}
    onChange={(e) => setRelation(e.target.value)}
    onFocus={() => setShowRelationSuggestions(true)}
    placeholder="Relation"
    style={{ width: "100px" }}
  />
  {showRelationSuggestions && (
    <ul
      style={{
        position: "absolute",
        background: "white",
        border: "1px solid #ccc",
        width: "100px",
        zIndex: 10,
      }}
    >
      {filterSuggestions(relation, relationsList).map((rel) => (
        <li
          key={rel}
          onClick={() => {
            setRelation(rel);
            setShowRelationSuggestions(false);
          }}
          style={{ padding: "4px", cursor: "pointer" }}
        >
          {rel}
        </li>
      ))}
    </ul>
  )}
</div>
<button onClick={addEdge}>Add Edge</button>
        <button onClick={undoLast}>Undo</button>
        <button onClick={clearGraph}>Clear All</button>
        <button onClick={saveToDb}>Save to Database</button>
         <button onClick={saveToFile}>Save as File</button>
  {/* hidden file input for “Load from File” */}
  <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={loadGraph}
          style={{ display: "none" }}
        />

        {/* —— DB dropdown + load buttons —— */}
        <label style={{ marginLeft: 12 }}>📂</label>
        <select
          value={selectedDbId}
          onChange={(e) => setSelectedDbId(e.target.value)}
          style={{ marginLeft: 4, padding: "4px" }}
        >
          <option value="">-- choose DB scenario --</option>
          {dbScenarios.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>
        <button onClick={loadFromDb} style={{ marginLeft: 4 }}>
          Load from DB
        </button>
        <button onClick={() => fileInputRef.current.click()} style={{ marginLeft: 8 }}>
          Load from File
        </button>
        <button
          onClick={() => {
            const currentNodeIds = cyRef.current.nodes().map((el) => el.id());
            if (typeof onAnalyze === "function") {
              const matrixRow = computeMatrixRow(currentNodeIds, "Graph manuel");
              onAnalyze(matrixRow);
            }
          }}
        >
          🔍 Analyser
        </button>


       </div>

      <div ref={containerRef} style={{ flex: 1, background: "lightgray", position: "relative" }}>
        {/* Cytoscape Container */}
      <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

        {/* Context Menu */}
        {contextMenu && selectedElement && (
        <div
          className="context-menu"
          style={{
          position: "absolute",
          top: contextMenu.position.y,
          left: contextMenu.position.x,
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "6px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          padding: "6px",
          fontSize: "14px",
          width: "160px",
          }}
       >
      <div
        onClick={() => {
          const newColor = prompt("Enter color (e.g. red, #FF0000):", "#FF5733");
          if (newColor) {
            if (contextMenu.type === "node") {
              selectedElement.style("background-color", newColor);
              selectedElement.data("customStyle", {
                ...selectedElement.data("customStyle"),
                "background-color": newColor,
              });
            } else if (contextMenu.type === "edge") {
              selectedElement.style("line-color", newColor);
              selectedElement.data("customStyle", {
                ...selectedElement.data("customStyle"),
                "line-color": newColor,
              });
            }
          }
          setContextMenu(null);
        }}
        
        style={{ padding: "4px", cursor: "pointer" }}
      >
        🎨 Change Color
      </div>

      {contextMenu.type === "node" && (
  <>
    <div
      onClick={() => {
        const shape = prompt("Enter shape (e.g. ellipse, rectangle, diamond):", "rectangle");
        if (shape) {
          selectedElement.style("shape", shape);
          selectedElement.data("customStyle", {
            ...selectedElement.data("customStyle"),
            shape: shape,
          });
        }
        setContextMenu(null);
      }}
      style={{ padding: "4px", cursor: "pointer" }}
    >
      🔺 Change Shape
    </div>

    <div
      onClick={() => {
        selectedElement.remove();
        setContextMenu(null);
      }}
      style={{ padding: "4px", cursor: "pointer", color: "red" }}
    >
      ❌ Remove
    </div>
  </>
)}    
      {contextMenu.type === "edge" && (
      <div
        onClick={() => {
          selectedElement.remove();
          setContextMenu(null);
        }}
        style={{ padding: "4px", cursor: "pointer", color: "red" }}
      >
        ❌ Remove
      </div>
    )}

      <div
        onClick={() => {
          const type = contextMenu.type;
          const color = prompt("Color for all " + (type === "node" ? "nodes" : "edges") + ":");
          const shape = type === "node" ? prompt("Shape for all nodes (ellipse, rect, triangle):", "ellipse") : null;
        
          const elements = cyRef.current.elements(type);
          elements.forEach((el) => {
            const styleToApply = {};
            if (color) {
              if (type === "node") {
                el.style("background-color", color);
                styleToApply["background-color"] = color;
              } else {
                el.style("line-color", color);
                styleToApply["line-color"] = color;
              }
            }
            if (shape && type === "node") {
              el.style("shape", shape);
              styleToApply["shape"] = shape;
            }
        
            el.data("customStyle", {
              ...el.data("customStyle"),
              ...styleToApply,
            });
          });
        
          setContextMenu(null);
        }}
        
        style={{ padding: "4px", cursor: "pointer" }}
      >
        🌐 Apply to All
      </div>
    </div>
  )}
  </div>
    </div>
  );
};

export default GraphEditor;
