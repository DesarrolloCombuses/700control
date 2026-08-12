/* ===========================
      LISTA ACTUALIZADA DE VEHÍCULOS
=========================== */
const vehiculosEsperados = {
  // Ruta 700
  703: "700", 705: "700", 707: "700", 714: "700", 715: "700",
  717: "700", 719: "700", 721: "700", 723: "700", 725: "700",
  728: "700", 729: "700", 730: "700", 731: "700", 733: "700",
  735: "700", 742: "700", 744: "700", 746: "700", 747: "700",
  748: "700", 749: "700", 752: "700", 758: "700", 759: "700",
  708: "700", 709: "700", 757: "700", 736: "700", 722: "700",
  710: "700", 718: "700", 720: "700", 750: "700", 726: "700",
  727: "700", 732: "700", 734: "700", 741: "700", 724: "700",
  737: "700", 740: "700", 755: "700", 753: "700", 754: "700",
  751: "700", 739: "700", 743: "700", 745: "700", 738: "700",
  756: "700"
};

const mapaBase = {
  703:4,705:4,707:4,708:5,709:3,
  714:3,715:4,716:3,717:4,718:3,
  719:2,720:3,721:4,722:3,723:3,
  724:3,725:4,726:3,727:3,728:4,
  729:1,730:1,731:4,732:1,733:5,
  734:3,735:4,736:8,737:3,738:3,
  739:3,740:3,741:3,742:3,744:3,
  745:3,746:4,747:5,748:2,749:2,
  750:3,751:3,752:3,753:3,754:3,
  755:3,757:5,758:3,759:6,756:0,
  743:3,756:8
};

/* =========================
   ESTADO GLOBAL FILTROS
========================= */
let activeTab = "ruta700";
let datosRuta700Global = [];
let datosTodosGlobal = [];

let vehiculosSeleccionados = new Set();
let estadoFiltros = {
  base: "",
  difNegativo: false,
  metroMayor20: false,
  texto: ""
};

function obtenerDatosActivos() {
  if (activeTab === "ruta700") return datosRuta700Global;
  return datosTodosGlobal;
}

function obtenerContainerActivo() {
  if (activeTab === "ruta700") return "tablaRuta700";
  return "tablaTodos";
}

// Actualizar fecha display
document.getElementById("fechaReporte").addEventListener("change", function() {
  const fecha = this.value;
  if (fecha) {
    const [anio, mes, dia] = fecha.split("-");
    document.getElementById("fechaDisplay").textContent = `${dia}/${mes}/${anio}`;
  } else {
    document.getElementById("fechaDisplay").textContent = "Seleccione una fecha";
  }
});

// Mostrar estado de archivos cargados
document.getElementById("fileDetalle").addEventListener("change", function() {
  const status = document.getElementById("statusDetalle");
  if (this.files.length > 0) {
    status.textContent = "✓ " + this.files[0].name;
    status.className = "file-status success";
  } else {
    status.textContent = "";
  }
});

document.getElementById("fileMetro").addEventListener("change", function() {
  const status = document.getElementById("statusMetro");
  if (this.files.length > 0) {
    status.textContent = "✓ " + this.files[0].name;
    status.className = "file-status success";
  } else {
    status.textContent = "";
  }
});

// NUEVO: Mostrar estado del archivo de ajustes
document.getElementById("fileAjustes").addEventListener("change", function() {
  const status = document.getElementById("statusAjustes");
  if (this.files.length > 0) {
    status.textContent = "✓ " + this.files[0].name;
    status.className = "file-status success";
  } else {
    status.textContent = "";
  }
});

/* ======================================================
   FUNCIÓN PARA PROCESAR ARCHIVO DE AJUSTES
====================================================== */
async function procesarAjustes(archivoAjustes, datosCompletos) {
  if (!archivoAjustes) {
    console.log("No se cargó archivo de ajustes");
    return datosCompletos;
  }

  try {
    const ajustesData = await leerExcel(archivoAjustes);
    console.log("Datos de ajustes cargados:", ajustesData);

    // Crear un mapa de ajustes por vehículo
    const mapaAjustes = {};

    ajustesData.forEach(ajuste => {
      // Buscar el vehículo en diferentes columnas posibles
      const vehiculo = ajuste["Vehiculo"] || ajuste["Vehículo"] || ajuste["Vehículo descripción"];
      const valorAjuste = Number(ajuste["Ajustes"] || ajuste["Ajuste"] || 0);

      if (vehiculo && !isNaN(valorAjuste)) {
        mapaAjustes[vehiculo] = valorAjuste;
      }
    });

    console.log("Mapa de ajustes:", mapaAjustes);

    // Aplicar ajustes a los datos
    return datosCompletos.map(item => {
      const vehiculo = item["Vehiculo"];
      const ajuste = mapaAjustes[vehiculo];

      if (ajuste !== undefined && !isNaN(ajuste)) {
        console.log(`Aplicando ajuste ${ajuste} al vehículo ${vehiculo}`);

        // Aplicar la misma lógica que tu función actual de ajustes
        const ajustePrevio = Number(item["Ajustes"] || 0);
        const ingresosBase = Number(item["Sonar "]) - Number(item["Descuento>20"]);
        const salidasP1Base = Number(item["Salidas P1"]) + ajustePrevio;

        // Aplicar nuevo ajuste
        const ingresosAjustados = ingresosBase - ajuste;
        const salidasP1Ajustadas = salidasP1Base - ajuste;
        const totalSalidas = salidasP1Ajustadas + Number(item[" Salidas P2"]);
        const difAjustada = ingresosAjustados - totalSalidas;

        return {
          ...item,
          "Ajustes": ajuste,
          "Ingresos totales": ingresosAjustados,
          "Salidas P1": salidasP1Ajustadas,
          "Total salidas": totalSalidas,
          "Dif": difAjustada
        };
      }

      return item;
    });

  } catch (error) {
    console.error("Error al procesar ajustes:", error);
    alert("Error al procesar archivo de ajustes. Se continuará sin ajustes.");
    return datosCompletos;
  }
}

/* ======================================================
   FUNCIÓN DE VALIDACIÓN Y CREACIÓN DE DATOS COMPLETOS
====================================================== */
function crearDatosCompletos(grupos, fechaClave, dia, mes, anioNum, mapaMetro) {
  const datosCompletos = [];
  const vehiculosEncontrados = Object.keys(grupos).map(v => Number(v));

  // Procesar todos los vehículos esperados en orden numérico
  const vehiculosOrdenados = Object.keys(vehiculosEsperados)
    .map(Number)
    .sort((a, b) => a - b);

  vehiculosOrdenados.forEach(vehiculo => {
    const ruta = vehiculosEsperados[vehiculo];
    const estaPresente = vehiculosEncontrados.includes(vehiculo);

    if (estaPresente) {
      // Vehículo presente - usar datos del archivo
      datosCompletos.push({
        ...grupos[vehiculo],
        "Validación": "PRESENTE",
        "Ruta Validación": ruta
      });
    } else {
      // Vehículo faltante - crear registro vacío con alerta
      datosCompletos.push({
        "Vehiculo": vehiculo,
        "Ingresos totales": 0,
        "Salidas P1": 0,
        " Salidas P2": 0,
        "Total salidas": 0,
        "Dif": 0,
        "Ruta": ruta,
        "Fecha": fechaClave,
        "Mes": obtenerMes(mes),
        "Año": anioNum,
        "# Día": obtenerDiaSemana(dia, mes, anioNum),
        "Base": mapaBase[vehiculo] || "SIN BASE",
        "Ajustes": 0,
        "Pasajeros metro": mapaMetro[vehiculo] || 0,
        "Descuento>20": 0,
        "No labora": "FALTANTE",
        "Observaciones": "Vehículo no encontrado en archivo",
        "Sonar ": 0,
        "Viajes realizados": 0,
        "SUB-RUTA": "",
        "Observaciones pasajero 20": "Vehículo faltante",
        "Validación": "FALTANTE",
        "Ruta Validación": ruta
      });
    }
  });

  return datosCompletos;
}

/* ======================================================
   FUNCIÓN PARA FILTRAR DATOS POR RUTA
====================================================== */
function filtrarPorRuta(datos, ruta) {
  return datos.filter(item => item["Ruta Validación"] === ruta);
}

/* ======================================================
   MOSTRAR TABLAS EN PESTAÑAS + INICIALIZAR FILTROS
====================================================== */
function mostrarTablasEnPestanas(datosCompletos) {
  const datosRuta700 = filtrarPorRuta(datosCompletos, "700");

  // Guardar globales
  datosRuta700Global = datosRuta700;
  datosTodosGlobal = datosCompletos;

  // Render inicial (sin filtros) en las dos tablas
  mostrarTabla(datosRuta700Global, "tablaRuta700");
  mostrarTabla(datosTodosGlobal, "tablaTodos");

  // Contadores en pestañas
  document.querySelector('[data-tab="ruta700"]').textContent = `Ruta 700 (${datosRuta700Global.length})`;
  document.querySelector('[data-tab="todos"]').textContent = `Todos (${datosTodosGlobal.length})`;

  // Mostrar container de pestañas y barra de filtros
  document.getElementById("tabsContainer").style.display = "block";
  document.getElementById("filterBar").style.display = "block";

  // Tab activa por defecto
  activeTab = "ruta700";

  // Inicializar filtros para la tab activa
  inicializarFiltrosUI();
  aplicarFiltros();
}

function inicializarFiltrosUI() {
  // Reset estado filtros
  vehiculosSeleccionados = new Set();
  estadoFiltros = {
    base: "",
    difNegativo: false,
    metroMayor20: false,
    texto: ""
  };

  // Reset UI
  const selBase = document.getElementById("filtroBase");
  const chkDif = document.getElementById("filtroDifNegativo");
  const chkMetro = document.getElementById("filtroMetroMayor20");
  const txtFiltro = document.getElementById("filtroTexto");

  if (selBase) selBase.value = "";
  if (chkDif) chkDif.checked = false;
  if (chkMetro) chkMetro.checked = false;
  if (txtFiltro) txtFiltro.value = "";

  // Construir combos / lista según tab activa
  construirOpcionesBase();
  construirModalVehiculos();
}

function construirOpcionesBase() {
  const selBase = document.getElementById("filtroBase");
  if (!selBase) return;

  const datos = obtenerDatosActivos();
  const bases = Array.from(
    new Set(
      datos
        .map(r => r["Base"])
        .filter(b => b !== "" && b != null)
    )
  ).sort((a, b) => String(a).localeCompare(String(b)));

  selBase.innerHTML = '<option value="">Todas</option>' +
    bases.map(b => `<option value="${b}">${b}</option>`).join("");
}

function construirModalVehiculos() {
  const cont = document.getElementById("listaVehiculos");
  if (!cont) return;

  const datos = obtenerDatosActivos();
  const vehiculos = Array.from(
    new Set(
      datos
        .map(r => r["Vehiculo"])
        .filter(v => v !== "" && v != null)
    )
  ).sort((a, b) => Number(a) - Number(b));

  let html = "";
  vehiculos.forEach(v => {
    const checked = vehiculosSeleccionados.has(v) ? "checked" : "";
    html += `
      <label>
        <input type="checkbox" value="${v}" ${checked}>
        ${v}
      </label>
    `;
  });

  cont.innerHTML = html;
}

function aplicarFiltros() {
  const baseDatos = obtenerDatosActivos();
  const containerId = obtenerContainerActivo();

  const filtrados = baseDatos.filter(row => {
    // Vehículos seleccionados
    if (vehiculosSeleccionados.size > 0 && !vehiculosSeleccionados.has(row["Vehiculo"])) {
      return false;
    }

    // Base
    if (estadoFiltros.base && String(row["Base"]) !== String(estadoFiltros.base)) {
      return false;
    }

    // DIF < 0
    if (estadoFiltros.difNegativo && !(Number(row["Dif"] || 0) < 0)) {
      return false;
    }

    // Metro > 20
    if (estadoFiltros.metroMayor20 && !(Number(row["Pasajeros metro"] || 0) > 20)) {
      return false;
    }

    // Texto general
    if (estadoFiltros.texto) {
      const t = estadoFiltros.texto.toLowerCase();
      const rowText = Object.values(row).join(" ").toLowerCase();
      if (!rowText.includes(t)) return false;
    }

    return true;
  });

  mostrarTabla(filtrados, containerId);
}

/* ======================================================
   PROCESAR REPORTE - LÓGICA PRINCIPAL
====================================================== */
document.getElementById("btnProcesar").addEventListener("click", async () => {
  const archivo = document.getElementById("fileDetalle").files[0];
  const archivoMetro = document.getElementById("fileMetro").files[0];
  const archivoAjustes = document.getElementById("fileAjustes").files[0]; // Nuevo
  const fechaSel = document.getElementById("fechaReporte").value;

  if(!fechaSel){ alert("Debes ingresar la fecha."); return; }
  if(!archivo){ alert("Debes cargar el archivo de viajes."); return; }
  if(!archivoMetro){ alert("Debes cargar archivo de Pasajeros Metro."); return; }

  // Mostrar loading
  document.getElementById("loading").style.display = "block";
  document.getElementById("btnProcesar").disabled = true;

  try {
    const [anio, mesRaw, diaRaw] = fechaSel.split("-");
    const fechaClave = `${diaRaw}/${mesRaw}/${anio}`;
    const dia = Number(diaRaw);
    const mes = Number(mesRaw) - 1;
    const anioNum = Number(anio);

    const viajes = await leerExcel(archivo);
    const metro = await leerExcel(archivoMetro);

    /* ======================================================
          MAPA METRO – SOLO POR VEHÍCULO (SIN FECHA)
    ======================================================= */
    const mapaMetro = {};
    metro.forEach(m => {
        const veh = Number(m["Vehiculos"]);
        const total = Number(m["Total general"] || 0);
        if(veh){
           mapaMetro[veh] = total;
        }
    });

    /* ======================================================
             AGRUPAR VIAJES POR VEHÍCULO
    ======================================================= */
    const grupos = {};

    viajes.forEach(r => {
      const veh = r["Vehículo descripción"] || r["Vehiculo descripción"] || r["Vehiculo"];
      if(!veh) return;

      const ingresos = Number(r["Ingresos totales"] || 0);
      const sP1 = Number(r["Salidas P1"] || 0);
      const sP2 = Number(r[" Salidas P2"] || 0);
      const sTot = Number(r["Salidas totales"] || 0);
      const nombreRuta = String(r["Nombre de ruta"] || "").toLowerCase();

      // VERIFICAR SI ES "SIN RUTA" - NO CONTAR ESTOS VIAJES
      const esSinRuta = nombreRuta.includes("sin ruta");

      const excedente = (esSinRuta || ingresos <= 20) ? 0 : ingresos - 20;

      // CALCULAR VALORES CON DESCUENTO APLICADO
      const ingresosConDescuento = ingresos - excedente;
      const salidasP1ConDescuento = sP1 - excedente;
      const totalSalidasConDescuento = sTot - excedente;

      if(!grupos[veh]){
        grupos[veh] = {
          "Vehiculo": veh,
          "Ingresos totales": ingresosConDescuento,
          "Salidas P1": salidasP1ConDescuento,
          " Salidas P2": sP2,
          "Total salidas": totalSalidasConDescuento,
          "Dif": 0,
          "Ruta": "700",
          "Fecha": fechaClave,
          "Mes": obtenerMes(mes),
          "Año": anioNum,
          "# Día": obtenerDiaSemana(dia, mes, anioNum),
          "Base": mapaBase[veh] || "SIN BASE",
          "Ajustes": 0,
          "Pasajeros metro": mapaMetro[veh] || 0,
          "Descuento>20": excedente,
          "No labora": "",
          "Observaciones": "",
          "Sonar ": ingresos,
          "Viajes realizados": esSinRuta ? 0 : 1,
          "SUB-RUTA": "",
          "Observaciones pasajero 20": ""
        };
      } else {
        grupos[veh]["Ingresos totales"] += ingresosConDescuento;
        grupos[veh]["Salidas P1"]       += salidasP1ConDescuento;
        grupos[veh][" Salidas P2"]      += sP2;
        grupos[veh]["Total salidas"]    += totalSalidasConDescuento;
        if (!esSinRuta) {
          grupos[veh]["Viajes realizados"] += 1;
        }
        grupos[veh]["Descuento>20"]     += excedente;
        grupos[veh]["Sonar "]           += ingresos;
      }
    });

    /* ======================================================
       DESCUENTO POR VIAJES REALIZADOS
       Se resta "Viajes realizados" de Ingresos totales y de
       Salidas P1 (mismo criterio que el ajuste manual), y se
       recalculan Total salidas y Dif con esos valores ya
       descontados.
    ======================================================= */
    Object.values(grupos).forEach(r => {
      const viajes = r["Viajes realizados"] || 0;
      r["Ingresos totales"] -= viajes;
      r["Salidas P1"] -= viajes;
      r["Total salidas"] = r["Salidas P1"] + r[" Salidas P2"];
      r["Dif"] = r["Ingresos totales"] - r["Total salidas"];
    });

    // CREAR DATOS COMPLETOS CON VEHÍCULOS FALTANTES
    let datosCompletos = crearDatosCompletos(grupos, fechaClave, dia, mes, anioNum, mapaMetro);

    // NUEVO: PROCESAR AJUSTES SI SE CARGÓ ARCHIVO
    datosCompletos = await procesarAjustes(archivoAjustes, datosCompletos);

    // MOSTRAR EN PESTAÑAS + FILTROS
    mostrarTablasEnPestanas(datosCompletos);

    document.getElementById("btnExportar").disabled = false;
    document.getElementById("btnExportar").onclick = () => exportarExcel(datosCompletos);

    // Contar vehículos faltantes
    const vehiculosFaltantes = datosCompletos.filter(item => item["Validación"] === "FALTANTE").length;
    if (vehiculosFaltantes > 0) {
      setTimeout(() => {
        alert(`⚠️ ATENCIÓN: Se encontraron ${vehiculosFaltantes} vehículos faltantes en el archivo. Verifique las tablas.`);
      }, 500);
    }

  } catch (error) {
    console.error("Error al procesar:", error);
    alert("Ocurrió un error al procesar los archivos. Verifique que sean válidos.");
  } finally {
    // Ocultar loading
    document.getElementById("loading").style.display = "none";
    document.getElementById("btnProcesar").disabled = false;
  }
});

/* ===========================
      MOSTRAR TABLA CON CAMPOS EDITABLES + TOTALES
=========================== */
function mostrarTabla(data, containerId){
  if (!data || data.length === 0) {
    document.getElementById(containerId).innerHTML = "<p>No hay datos para mostrar</p>";
    return;
  }

  const columnas = Object.keys(data[0]);
  let html = "<table><thead><tr>";

  columnas.forEach(c => html += `<th>${c}</th>`);
  html += "</tr></thead><tbody>";

  data.forEach((r, i) => {
    const esFaltante = r["Validación"] === "FALTANTE";
    const claseFila = esFaltante ? "vehiculo-faltante" : "";

    html += `<tr class="${claseFila}" data-index="${i}">`;

    columnas.forEach(c => {
      const valor = r[c];

      if (c === "Validación") {
        const claseAlerta = esFaltante ? "alerta-faltante" : "alerta-presente";
        html += `<td class="${claseAlerta}">${valor}</td>`;

      } else if (c === "Ajustes" && !esFaltante) {
        html += `
          <td>
            <input type="number"
                   value="${valor}"
                   data-index="${i}"
                   data-column="${c}"
                   class="ajuste-input"
                   style="width:60px; text-align:center;">
          </td>`;

      } else if ((c === "Ingresos totales" || c === "Salidas P1") && !esFaltante) {
        // CAMPOS NUMÉRICOS EDITABLES
        html += `
          <td class="editable">
            <input type="number"
                   value="${valor}"
                   data-index="${i}"
                   data-column="${c}"
                   class="editable-input"
                   style="width:80px; text-align:center;">
          </td>`;

      } else if ((c === "Observaciones" || c === "Observaciones pasajero 20" || c === "No labora") && !esFaltante) {
        // CAMPOS DE TEXTO LARGO
        html += `
          <td class="editable">
            <textarea
                   data-index="${i}"
                   data-column="${c}"
                   class="textarea-input">${valor}</textarea>
          </td>`;

      } else if (c === "Viajes realizados" && !esFaltante) {
        html += `
          <td class="editable">
            <input type="number"
                   value="${valor}"
                   data-index="${i}"
                   data-column="${c}"
                   class="editable-input"
                   style="width:60px; text-align:center;">
          </td>`;

      } else {
        html += `<td class="bloqueado" data-column="${c}">${valor}</td>`;
      }
    });

    html += "</tr>";
  });

  /* =======================================================
             FILA DE TOTALES (AL FINAL DE LA TABLA)
  ======================================================= */
  const totales = {};
  columnas.forEach(c => totales[c] = 0);

  data.forEach(r => {
    columnas.forEach(c => {
      if (typeof r[c] === "number") {
        totales[c] += r[c];
      }
    });
  });

  html += `<tr style="background:#e9f5ff; font-weight:bold;">`;

  columnas.forEach(c => {
    if (typeof totales[c] === "number") {
      html += `<td>${totales[c]}</td>`;
    } else {
      html += `<td></td>`;
    }
  });

  html += `</tr>`;

  html += "</tbody></table>";

  document.getElementById(containerId).innerHTML = html;

  // Activar eventos para campos editables
  activarAjustesDinamicos(data);
  activarCamposEditables(data);
}

/* ======================================================
   AJUSTES DINÁMICOS CON DESCUENTO - CORREGIDO
====================================================== */
function activarAjustesDinamicos(data){
  const inputs = document.querySelectorAll(".ajuste-input");

  inputs.forEach(input => {
    input.addEventListener("input", function(){
      const index = Number(this.dataset.index);
      const fila = data[index];
      const rowElement = this.closest('tr');

      const ajustePrevio = Number(fila["Ajustes"] || 0);
      const ajusteNuevo  = Number(this.value) || 0;

      // guardar nuevo ajuste
      fila["Ajustes"] = ajusteNuevo;

      // OBTENER VALORES BASE (del cálculo inicial con descuento)
      const ingresosBase = Number(fila["Sonar "]) - Number(fila["Descuento>20"]);
      const salidasP1Base = Number(fila["Salidas P1"]) + ajustePrevio;

      // APLICAR AJUSTE A AMBAS COLUMNAS
      const ingresosAjustados = ingresosBase - ajusteNuevo;
      const salidasP1Ajustadas = salidasP1Base - ajusteNuevo;

      // RECALCULAR TOTAL SALIDAS Y DIF DESDE CERO
      const totalSalidas = salidasP1Ajustadas + Number(fila[" Salidas P2"]);
      const difAjustada = ingresosAjustados - totalSalidas;

      // Actualizar fila
      fila["Ingresos totales"] = ingresosAjustados;
      fila["Salidas P1"] = salidasP1Ajustadas;
      fila["Total salidas"] = totalSalidas;
      fila["Dif"] = difAjustada;

      // ACTUALIZAR VISUALMENTE LAS CELDAS BLOQUEADAS
      const celdasBloqueadas = rowElement.querySelectorAll('.bloqueado');
      celdasBloqueadas.forEach(celda => {
        const columna = celda.getAttribute('data-column');
        switch(columna) {
          case 'Ingresos totales':
            celda.textContent = ingresosAjustados;
            break;
          case 'Salidas P1':
            celda.textContent = salidasP1Ajustadas;
            break;
          case 'Total salidas':
            celda.textContent = totalSalidas;
            break;
          case 'Dif':
            celda.textContent = difAjustada;
            break;
        }
      });

      // ACTUALIZAR INPUTS EDITABLES TAMBIÉN
      const inputsEditables = rowElement.querySelectorAll('.editable-input');
      inputsEditables.forEach(inputEditable => {
        const columnaInput = inputEditable.getAttribute('data-column');
        if (columnaInput === 'Ingresos totales') {
          inputEditable.value = ingresosAjustados;
        } else if (columnaInput === 'Salidas P1') {
          inputEditable.value = salidasP1Ajustadas;
        }
      });
    });
  });
}

/* ======================================================
   ACTIVAR CAMPOS EDITABLES
====================================================== */
function activarCamposEditables(data) {
  // Campos numéricos (excepto ajustes)
  const inputsNumericos = document.querySelectorAll('.editable-input:not(.ajuste-input)');
  inputsNumericos.forEach(input => {
    input.addEventListener('input', function() {
      const index = parseInt(this.getAttribute('data-index'));
      const columna = this.getAttribute('data-column');
      const valor = this.value;

      data[index][columna] = valor;

      // Recalcular diferencias si se modifican ingresos o salidas
      if (columna === "Ingresos totales" || columna === "Salidas P1" || columna === " Salidas P2") {
        recalcularDiferencias(data[index]);
      }
    });
  });

  // Campos de texto largos
  const textareas = document.querySelectorAll('.textarea-input');
  textareas.forEach(textarea => {
    textarea.addEventListener('input', function() {
      const index = parseInt(this.getAttribute('data-index'));
      const columna = this.getAttribute('data-column');
      const valor = this.value;

      data[index][columna] = valor;
    });
  });
}

/* ======================================================
   RECALCULAR DIFERENCIAS
====================================================== */
function recalcularDiferencias(fila) {
  const ingresos = parseFloat(fila["Ingresos totales"]) || 0;
  const salidasP1 = parseFloat(fila["Salidas P1"]) || 0;
  const salidasP2 = parseFloat(fila[" Salidas P2"]) || 0;

  const totalSalidas = salidasP1 + salidasP2;
  const diferencia = ingresos - totalSalidas;

  fila["Total salidas"] = totalSalidas;
  fila["Dif"] = diferencia;
}

/* ======================================================
   MANEJO DE PESTAÑAS
====================================================== */
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('tab')) {
    const tabId = e.target.getAttribute('data-tab');

    // Remover clase active de todas las pestañas y contenidos
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Agregar clase active a la pestaña y contenido seleccionados
    e.target.classList.add('active');
    document.getElementById(`tab-${tabId}`).classList.add('active');

    // Actualizar tab activa y filtros
    activeTab = tabId;
    inicializarFiltrosUI();
    aplicarFiltros();
  }
});

/* =========================
   EVENTOS BARRA FILTROS
========================= */
document.getElementById("filtroBase").addEventListener("change", e => {
  estadoFiltros.base = e.target.value;
  aplicarFiltros();
});

document.getElementById("filtroDifNegativo").addEventListener("change", e => {
  estadoFiltros.difNegativo = e.target.checked;
  aplicarFiltros();
});

document.getElementById("filtroMetroMayor20").addEventListener("change", e => {
  estadoFiltros.metroMayor20 = e.target.checked;
  aplicarFiltros();
});

document.getElementById("filtroTexto").addEventListener("input", e => {
  estadoFiltros.texto = e.target.value.trim();
  aplicarFiltros();
});

document.getElementById("btnLimpiarFiltros").addEventListener("click", () => {
  inicializarFiltrosUI();
  aplicarFiltros();
});

/* =========================
   MODAL VEHÍCULOS
========================= */
const modalVehiculos = document.getElementById("modalVehiculos");
const btnVehiculos = document.getElementById("btnVehiculos");
const btnCerrarModal = document.getElementById("cerrarModalVehiculos");
const btnVehTodos = document.getElementById("btnVehiculosTodos");
const btnVehNinguno = document.getElementById("btnVehiculosNinguno");
const btnVehAplicar = document.getElementById("btnAplicarVehiculos");

btnVehiculos.addEventListener("click", () => {
  construirModalVehiculos();
  modalVehiculos.classList.add("visible");
});

btnCerrarModal.addEventListener("click", () => {
  modalVehiculos.classList.remove("visible");
});

modalVehiculos.addEventListener("click", (e) => {
  if (e.target === modalVehiculos) {
    modalVehiculos.classList.remove("visible");
  }
});

btnVehTodos.addEventListener("click", () => {
  const checks = modalVehiculos.querySelectorAll("input[type='checkbox']");
  checks.forEach(ch => ch.checked = true);
});

btnVehNinguno.addEventListener("click", () => {
  const checks = modalVehiculos.querySelectorAll("input[type='checkbox']");
  checks.forEach(ch => ch.checked = false);
});

btnVehAplicar.addEventListener("click", () => {
  vehiculosSeleccionados = new Set();
  const checks = modalVehiculos.querySelectorAll("input[type='checkbox']");
  checks.forEach(ch => {
    if (ch.checked) {
      const v = ch.value;
      vehiculosSeleccionados.add(isNaN(Number(v)) ? v : Number(v));
    }
  });
  modalVehiculos.classList.remove("visible");
  aplicarFiltros();
});

/* ===========================
      FUNCIONES AUXILIARES
=========================== */
function obtenerDiaSemana(d, m, a){
  const fecha = new Date(a, m, d);
  const dias = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  return dias[fecha.getDay()];
}

function leerExcel(archivo){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e)=>{
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type:"array"});
        const sheet = workbook.SheetNames[0];
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {defval:""});
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsArrayBuffer(archivo);
  });
}

function obtenerMes(m){
  return ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
          "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"][m];
}

function exportarExcel(data){
  const fecha = document.getElementById("fechaReporte").value;
  const nombreArchivo = `Resumen_vehiculos_${fecha || 'sin_fecha'}.xlsx`;

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Resumen");
  XLSX.writeFile(wb, nombreArchivo);
}
