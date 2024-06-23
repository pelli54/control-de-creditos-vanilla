const CLIENTESDBNAME = "crediAppClientesDB";
const TRANSACCDBNAME = "crediAppTransaccDB";

//SCHEMAS
const clienteSchema = {
  id: {
    type: Number,
    required: false,
    unique: true,
  },
  nombre: {
    type: String,
    required: true,
    unique: true,
  },
};

const transacSchema = {
  id: {
    type: Number,
    required: false,
  },
  clienteid: {
    type: Number,
    required: true,
  },
  monto: {
    type: Number,
    required: true,
  },
  moneda: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
    required: true,
  },
  fecha: {
    type: String,
    required: true,
  },
  nota: {
    type: String,
    required: false,
  },
};

function validate(data, schema) {
  let errors = [];
  for (let key in schema) {
    if (
      (data[key] === undefined || data[key] === null) &&
      schema[key].required
    ) {
      errors.push({
        field: key,
        message: `Field ${key} is required`,
      });
      console.log(data[key], schema[key]);
    } else if (data[key]) {
      if (data[key] instanceof schema[key].type) {
        errors.push({
          field: key,
          message: `Field ${key} type is invalid`,
        });
      }
    }
  }
  return errors;
}

/**
 *  '30/5/2024'
 * @returns String
 */
function generateFecha() {
  let da = new Date().toLocaleString().split(",")[0].split("/");
  da[2] = da[2].slice(2, 4);
  return da.join("/");
}

function initLocalDB(name) {
  let db = localStorage.getItem(name);
  if (!db) {
    let v = JSON.stringify([]);
    localStorage.setItem(name, v);
    db = v;
  }
  db = JSON.parse(db);
  return db;
}

function LocalDB(nam) {
  let clientesDB = initLocalDB(CLIENTESDBNAME);
  let transacDB = initLocalDB(TRANSACCDBNAME);
  return {
    clientes: {
      getAll: () => {
        return clientesDB;
      },
      getById: (id) => {
        return clientesDB.find((el) => el.id == id);
      },
      create: (data) => {
        let errors = validate(data, clienteSchema);
        if (errors.length > 0) {
          errors.forEach((err) => {
            alert(err.message);
          });
          return;
        }
        let id = clientesDB.length;
        let alreadyExist = clientesDB.find((el) => el.nombre === data.nombre);
        if (alreadyExist) {
          alert("Nombre ya existe");
          return;
        }
        clientesDB.push({ id, ...data });
        localStorage.setItem(CLIENTESDBNAME, JSON.stringify(clientesDB));
        return {
          id,
          ...data,
        };
      },
    },
    transac: {
      getAll: () => {
        return transacDB;
      },
      getById: (id) => {
        return transacDB.find((el) => el.id == id);
      },
      getByClienteId: (id) => {
        return transacDB.filter((tra) => tra.clienteid === id);
      },
      create: (data) => {
        let errors = validate(data, transacSchema);
        if (errors.length > 0) {
          errors.forEach((err) => {
            alert(err.message);
          });
          return;
        }
        let id = transacDB.length;
        let clienteExist = clientesDB.find((cl) => cl.id == data.clienteid);
        if (!clienteExist) {
          alert("Cliente no existe");
        }
        transacDB.push({
          id,
          ...data,
        });
        localStorage.setItem(TRANSACCDBNAME, JSON.stringify(transacDB));
        return {
          id,
          ...data,
        };
      },
    },
  };
}

function main() {
  let db = LocalDB();

  let currentClienteId = null;
  let tipoTransac = "Credito";
  let monedaTransac = "$";

  let clienteForm = document.getElementById("clienteForm");
  let transacForm = document.getElementById("transacForm");
  let list = document.getElementById("clienteList");
  let transacList = document.getElementById("transacList");
  let btnNewCliente = document.getElementById("btnNewCliente");
  let btnCancelNewCliente = document.getElementById("btnCancelNewCliente");
  let btnNewTransac = document.getElementById("btnNewTransac");
  let btnCancelNewTransac = document.getElementById("btnCancelNewTransac");
  let btnCreditoSelect = document.getElementById("btnCreditoSelect");
  let btnDebitoSelect = document.getElementById("btnDebitoSelect");
  let btnDolarSelect = document.getElementById("btnDolarSelect");
  let btnBssSelect = document.getElementById("btnBssSelect");
  let saldoBssDisplay = document.getElementById('saldoBssDisplay')
  let saldoDolarDisplay = document.getElementById('saldoDolarDisplay')

  function toggleFormCliente() {
    let view = document.getElementById("clienteView");
    clienteForm.classList.toggle("hidden");
    view.classList.toggle("hidden");
  }
  function toggleFormTransac() {
    let form = document.getElementById("transacForm");
    let view = document.getElementById("transacView");
    form.classList.toggle("hidden");
    view.classList.toggle("hidden");
  }

  function asignBtnClose() {
    btnNewCliente.onclick = toggleFormCliente;
    btnCancelNewCliente.onclick = toggleFormCliente;
    btnNewTransac.onclick = toggleFormTransac;
    btnCancelNewTransac.onclick = toggleFormTransac;
  }

  

  function calculateSaldo(transac) {
    //debugger
    let bss = transac.reduce((acc, t) => {
      let sumRest = t.tipo === "Credito" ? -1 : t.tipo === "Debito" ? 1 : 1;
      if (t.moneda !== "Bss") {
        return acc;
      }
      let res = (acc += Number(t.monto) * sumRest);

      return res
    }, 0) || 0
    let dolar = transac.reduce((acc, t) => {
      let sumRest = t.tipo === "Credito" ? -1 : t.tipo === "Debito" ? 1 : 1;
      if (t.moneda !== "$") {
        return acc;
      }
      return (acc += t.monto * sumRest);
    }, 0) || 0
    return {
      bss,
      dolar,
    };
  }  

  //DB REPO
  function getClientes() {
    let clientes = db.clientes.getAll();
    if (clientes.length === 0) {
      return [];
    }
    currentClienteId = 0;
    return clientes;
  }

  function createCliente(data) {
    let client = {
      nombre: data.nombre,
    };
    return db.clientes.create(client);
  }

  function createNewTransac(data) {
    let transac = {
      monto: data.monto,
      tipo: data.tipo,
      moneda: data.moneda,
      clienteid: data.clienteid,
      fecha: data.fecha,
      nota: data.nota,
    };
    db.transac.create(transac);
  }

  function getTransacByClientId(id) {
    return db.transac.getByClienteId(id);
  }

  //EVENT HANDLERS
  function handleCreateNewCliente(e) {
    e.preventDefault();
    let nombre = e.target.nombre.value;
    let cliente = createCliente({ nombre });
    e.target.nombre.value = "";
    currentClienteId = cliente.id;
    list.value = currentClienteId
    toggleFormCliente();
    renderClientesList();
  }

  function handleCreateNewTransac(e) {
    e.preventDefault();
    if (currentClienteId === null) {
      alert("Seleccione un Cliente");
      return;
    }

    let data = {
      monto: e.target.monto.value,
      tipo: tipoTransac,
      moneda: monedaTransac,
      nota: e.target.nota.value,
      clienteid: currentClienteId,
      fecha: generateFecha(),
    };

    e.target.monto.value = "";
    e.target.nota.value = "";

    createNewTransac(data);
    renderTransacList(getTransacByClientId(currentClienteId));
    showSaldo(getTransacByClientId(currentClienteId))
    toggleFormTransac();
  }

  function handleChangeListCliente(e) {
    let transacs = getTransacByClientId(Number(e.target.value));
    currentClienteId = Number(e.target.value);
    showSaldo(transacs)
    renderTransacList(transacs);
  }

  function handleClickOptionsBtnFrom(e) {
    let v = e.target.value;
    if (v === "Credito") {
      tipoTransac = "Credito";
      btnCreditoSelect.classList.add("activeBtn");
      btnDebitoSelect.classList.remove("activeBtn");
    } else if (v === "Debito") {
      tipoTransac = "Debito";
      btnDebitoSelect.classList.add("activeBtn");
      btnCreditoSelect.classList.remove("activeBtn");
    } else if (v === "$") {
      monedaTransac = "$";
      btnDolarSelect.classList.add("activeBtn");
      btnBssSelect.classList.remove("activeBtn");
    } else if (v === "Bss") {
      monedaTransac = "Bss";
      btnBssSelect.classList.add("activeBtn");
      btnDolarSelect.classList.remove("activeBtn");
    }
  }

  //RENDERS
  function renderClientesList() {
    let clientes = getClientes();
    list.innerHTML = "";
    clientes.forEach((cli) => {
      list.innerHTML += `
        <option value="${cli.id}">${cli.nombre}</option>
      `;
    });
    if (currentClienteId) {
      list.value = currentClienteId;
    }
  }

  function renderTransacList(transacs) {
    transacs = transacs.reverse()
    transacList.innerHTML = "";
    if (transacs.length === 0) {
      transacList.innerHTML = `<h2 class="text-center text-xl">No hay Transacciones</h2>`;
      return;
    }
    let header = `<div
        class="grid grid-cols-12 font-semibold p-1 text-center"
      >
        <span class="col-span-2 text-start">Monto</span>
        <span class="col-span-2">Tipo</span>
        <span class="col-span-3">Fecha</span>
        <span class="col-span-5 text-start">Nota</span>
      </div>`;
    transacList.innerHTML += header;
    transacs.forEach((t) => {
      isCredito = t.tipo === "Credito";
      transacList.innerHTML += `
          <div
            class="grid grid-cols-12  hover:bg-gray-300 rounded-sm p-1 text-center ${
              isCredito ? "text-red-400" : ""
            }"
          >
            <span class="col-span-2 text-start">${isCredito ? "-" : ""}${Number(
        t.monto
      ).toFixed(2)} ${t.moneda}</span>
            <span class="col-span-2">${t.tipo}</span>
            <span class="col-span-3">${t.fecha}</span>
            <span
              class="col-span-5 text-start truncate hover:overflow-visible hover:whitespace-normal"
              >${t.nota}</span
            >
          </div>`;
    });
  }

  function showSaldo(transacs){
    let { bss, dolar } = calculateSaldo(transacs)
    saldoBssDisplay.innerText = `${bss.toFixed(2)}`
    if(bss < 0){
      saldoBssDisplay.parentElement.classList.add('text-red-500')
      saldoBssDisplay.parentElement.classList.remove('text-black')
    }else{
      saldoBssDisplay.parentElement.classList.add('text-black')
      saldoBssDisplay.parentElement.classList.remove('text-red-500')
    }
    saldoDolarDisplay.innerText = `${dolar.toFixed(2)}`
    if(dolar < 0){
      saldoDolarDisplay.parentElement.classList.add('text-red-500')
      saldoDolarDisplay.parentElement.classList.remove('text-black')
    }else{
      saldoDolarDisplay.parentElement.classList.add('text-black')
      saldoDolarDisplay.parentElement.classList.remove('text-red-500')
    }
  }

  btnBssSelect.onclick = handleClickOptionsBtnFrom;
  btnDolarSelect.onclick = handleClickOptionsBtnFrom;
  btnDebitoSelect.onclick = handleClickOptionsBtnFrom;
  btnCreditoSelect.onclick = handleClickOptionsBtnFrom;

  clienteForm.onsubmit = handleCreateNewCliente;
  transacForm.onsubmit = handleCreateNewTransac;
  list.onchange = handleChangeListCliente;
  btnCreditoSelect.classList.toggle("activeBtn");
  btnDolarSelect.classList.toggle("activeBtn");
  asignBtnClose();
  renderClientesList();
  if(getClientes().length === 0){
    currentClienteId = null
  }else{
    currentClienteId = 0
    let transacs = getTransacByClientId(currentClienteId)
    renderTransacList(transacs)
    showSaldo(transacs)
  }
}

document.addEventListener("DOMContentLoaded", main);
