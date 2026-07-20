import { useEffect, useMemo, useState } from "react";
import { supabase } from "../services/supabase";
import "../App.css";

const CLAVE_ADMIN = "arte2026";

function Admin() {
  const [autorizado, setAutorizado] = useState(
    sessionStorage.getItem("admin_autorizado") === "true"
  );

  const [clave, setClave] = useState("");
  const [errorAcceso, setErrorAcceso] = useState("");

  const [registros, setRegistros] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [error, setError] = useState("");

  const iniciarSesion = (e) => {
    e.preventDefault();

    if (clave !== CLAVE_ADMIN) {
      setErrorAcceso("La contraseña es incorrecta.");
      return;
    }

    sessionStorage.setItem("admin_autorizado", "true");
    setAutorizado(true);
    setErrorAcceso("");
  };

  const cerrarSesion = () => {
    sessionStorage.removeItem("admin_autorizado");
    setAutorizado(false);
    setClave("");
  };

  const cargarRegistros = async () => {
    try {
      setCargando(true);
      setError("");

      const { data, error: supabaseError } = await supabase
        .from("registros")
        .select("*")
        .order("numero", { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      setRegistros(data || []);
    } catch (err) {
      console.error("Error al cargar registros:", err);
      setError("No se pudieron cargar los registros.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (autorizado) {
      cargarRegistros();
    }
  }, [autorizado]);

  const registrosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) {
      return registros;
    }

    return registros.filter((registro) => {
      return (
        String(registro.numero).includes(texto) ||
        registro.nombre.toLowerCase().includes(texto) ||
        registro.carrera.toLowerCase().includes(texto) ||
        registro.telefono.includes(texto)
      );
    });
  }, [busqueda, registros]);

  const descargarCSV = () => {
    const encabezados = [
      "Número",
      "Nombre",
      "Carrera",
      "Teléfono",
      "Fecha",
    ];

    const filas = registros.map((registro) => [
      String(registro.numero).padStart(3, "0"),
      registro.nombre,
      registro.carrera,
      registro.telefono,
      new Date(registro.created_at).toLocaleString("es-SV"),
    ]);

    const contenido = [encabezados, ...filas]
      .map((fila) =>
        fila
          .map((valor) => `"${String(valor).replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");

    const archivo = new Blob(["\uFEFF" + contenido], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement("a");

    enlace.href = url;
    enlace.download = "registros-participantes.csv";

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  };

  const eliminarRegistro = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el registro de "${nombre}"?\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmar) {
      return;
    }

    try {
      setEliminandoId(id);
      setError("");

      const { error: errorEliminar } = await supabase
        .from("registros")
        .delete()
        .eq("id", id);

      if (errorEliminar) {
        throw errorEliminar;
      }

      // Lo elimina inmediatamente de la tabla visible.
      setRegistros((registrosActuales) =>
        registrosActuales.filter((registro) => registro.id !== id)
      );
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError(
        "No se pudo eliminar el registro. Revisa la política DELETE de Supabase."
      );
    } finally {
      setEliminandoId(null);
    }
  };

  if (!autorizado) {
    return (
      <main className="pagina">
        <section className="tarjeta login-admin">
          <div className="logo-placeholder">USO</div>

          <p className="institucion">Universidad de Sonsonate</p>

          <h1>Acceso administrativo</h1>

          <p className="descripcion">
            Ingresa la contraseña para consultar los registros.
          </p>

          <form className="formulario" onSubmit={iniciarSesion}>
            <div className="campo">
              <label htmlFor="clave">Contraseña</label>

              <input
                id="clave"
                type="password"
                placeholder="Escribe la contraseña"
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value);
                  setErrorAcceso("");
                }}
                autoComplete="current-password"
                required
              />
            </div>

            {errorAcceso && (
              <div className="mensaje-error" role="alert">
                {errorAcceso}
              </div>
            )}

            <button type="submit">Ingresar al panel</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <main className="pagina pagina-admin">
      <section className="panel-admin">
        <div className="admin-encabezado">
          <div>
            <p className="institucion">Universidad de Sonsonate</p>

            <h1>Panel de registros</h1>

            <p className="descripcion">
              Consulta y exporta los participantes registrados.
            </p>
          </div>

          <div className="admin-resumen">
            <div className="total-registros">
              <span>Total</span>
              <strong>{registros.length}</strong>
            </div>

            <button
              type="button"
              className="boton-cerrar-sesion"
              onClick={cerrarSesion}
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        <div className="admin-acciones">
          <input
            type="search"
            placeholder="Buscar por número, nombre, carrera o teléfono"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <button
            type="button"
            onClick={descargarCSV}
            disabled={registros.length === 0}
          >
            Descargar CSV
          </button>

          <button
            type="button"
            className="boton-actualizar"
            onClick={cargarRegistros}
            disabled={cargando}
          >
            {cargando ? "Actualizando..." : "Actualizar"}
          </button>
        </div>

        {error && (
          <div className="mensaje-error" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="estado-admin">Cargando registros...</p>
        ) : registrosFiltrados.length === 0 ? (
          <p className="estado-admin">No se encontraron registros.</p>
        ) : (
          <div className="tabla-contenedor">
            <table className="tabla-registros">
              <thead>
                <tr>
                  <th>N.º</th>
                  <th>Nombre</th>
                  <th>Carrera</th>
                  <th>Teléfono</th>
                  <th>Fecha y hora</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {registrosFiltrados.map((registro) => (
                  <tr key={registro.id}>
                    <td>
                      {String(registro.numero).padStart(3, "0")}
                    </td>

                    <td>{registro.nombre}</td>

                    <td>{registro.carrera}</td>

                    <td>{registro.telefono}</td>

                    <td>
                      {new Date(registro.created_at).toLocaleString(
                        "es-SV"
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn-eliminar"
                        onClick={() =>
                          eliminarRegistro(
                            registro.id,
                            registro.nombre
                          )
                        }
                        disabled={eliminandoId === registro.id}
                        title={`Eliminar a ${registro.nombre}`}
                      >
                        {eliminandoId === registro.id
                          ? "Eliminando..."
                          : "🗑 Eliminar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default Admin;