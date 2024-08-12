var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var multer = require('multer');
var path = require('path');
var WebSocket = require('ws');
var app = express();
var shortid = require('shortid');

app.use(express.json());
app.use(cors());


//  Especiica el origen exacto (recomendado para producción)
var corsOptions = {
    //origin: 'https://esammarketingapi-36cc8f6bb2a2.herokuapp.com',  // Asegúrate que este sea el puerto y protocolo donde se ejecuta tu cliente Vue.js
   //origin: 'https://mktlapaz.esam.edu.bo/',
    origin: '*',
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// parametros para la conexion
var conexion = mysql.createConnection({
    /*host: 'localhost',
    user:'root',
    password:'',
    database:'marketing_db'*/
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT

});

const wsPort = process.env.WS_PORT || 8080;
const wss = new WebSocket.Server({ port: wsPort });
//const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
    ws.on('message', message => {
      // Cuando se recibe un mensaje, reenviar a todos los clientes conectados
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });

// probamos la conexion
conexion.connect(function(error){
if(error)
    {
        throw error;
    }else{
        console.log("La conexión a la base de datos es exitosa");
    }
});


app.get('/', function(req, res){
    res.send('ruta INICIOnueva ')
})

// mostrar todos las programas
app.get('/api/programas',(req,res) =>{
    const query = `
    SELECT 
            p.Cod_Programa AS Cod_Programa, 
            p.Nombre AS Nombre, 
           a.Nombre_Area AS Area, 
           e.estado AS Estado
    FROM marketing_db.programas p
    JOIN marketing_db.area a ON p.Cod_Area = a.Cod_Area
    JOIN marketing_db.estado_programa e ON p.cod_estado_p = e.cod_estado_p;
    `;
    
    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al ejecutar la consulta:', error);
            return res.status(500).send('Error interno del servidor');
        }
        res.send(results);
    });
});

// Numero de inscritos por programa
app.get('/api/inscritos_por_programa', (req, res) => {
    const query = `
        SELECT 
            cod_programa, 
            COUNT(*) as num_inscritos 
        FROM 
            marketing_db.inscripciones
        GROUP BY 
            cod_programa
    `;
    conexion.query(query, (error, results) => {
        if (error) {
            console.error('Error al obtener el número de inscritos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        res.send(results);
    });
});

// mostrar todas las areas
app.get('/api/areas',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.area;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las profesiones
app.get('/api/profesiones',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.profesiones;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las institucion de egreso
app.get('/api/institucion_egreso',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.institucion_egreso;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos los grados academicos
app.get('/api/grado_academico',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.grado_academico;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos los grados academicos
app.get('/api/grado_academico',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.grado_academico;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las ciudades de residencia
app.get('/api/ciudad_residencia',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.ciudad_residencia;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})
// mostrar todos los asesores
app.get('/api/asesores',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.asesores;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})
// Muestra todas las inscripciones con detalles de persona y programa
app.get('/api/inscripciones_persona', (req, res) => {
    const sql = `
    SELECT 
            p.num_doc,
            p.nombres,
            p.apellidos,
            p.genero,
            p.fecha_nac,
            p.domicilio,
            p.telefono,
            p.correo,
            cr.nombre_ciudad AS ciudad_residencia,
            ga.grado_academico AS grado_academico,
            ie.nombre_institucion AS institucion_egreso,
            pr.nombre_profesion AS profesion,
            pg.Nombre AS programa,
            ins.fecha_reg,
            ins.cod_asesor
    FROM 
        marketing_db.persona p
    JOIN 
        marketing_db.inscripciones ins ON p.cod_persona = ins.cod_persona
    JOIN 
        marketing_db.ciudad_residencia cr ON p.cod_ciudad_r = cr.cod_ciudad_r
    JOIN 
        marketing_db.programas pg ON ins.Cod_Programa = pg.Cod_Programa
    JOIN 
        marketing_db.grado_academico ga ON p.cod_grado_a = ga.cod_grado_a
    JOIN 
        marketing_db.institucion_egreso ie ON p.cod_institucion_e = ie.cod_institucion_e
    JOIN 
        marketing_db.profesiones pr ON p.cod_profesion = pr.cod_profesion;
    `;
    conexion.query(sql, (error, filas) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        } else {-
            res.send(filas);
        }
    });
});

// Muestra todas las inscripciones por programa con detalles de persona
app.get('/api/inscripciones_por_programa', (req, res) => {
    const codPrograma = req.query.Cod_Programa;
    if (!codPrograma) {
        return res.status(400).send('Falta el parámetro Cod_Programa');
    }
    const sql = `
    SELECT 
            p.num_doc,
            p.nombres,
            p.apellidos,
            p.genero,
            p.fecha_nac,
            p.domicilio,
            p.telefono,
            p.correo,
            cr.nombre_ciudad AS ciudad_residencia,
            ga.grado_academico AS grado_academico,
            ie.nombre_institucion AS institucion_egreso,
            pr.nombre_profesion AS profesion,
            pg.Nombre AS programa,
            ins.fecha_reg,
            ins.cod_asesor,
            ase.nombre
    FROM 
        marketing_db.persona p
    JOIN 
        marketing_db.inscripciones ins ON p.cod_persona = ins.cod_persona
    JOIN 
        marketing_db.ciudad_residencia cr ON p.cod_ciudad_r = cr.cod_ciudad_r
    JOIN 
        marketing_db.programas pg ON ins.Cod_Programa = pg.Cod_Programa
    JOIN 
        marketing_db.grado_academico ga ON p.cod_grado_a = ga.cod_grado_a
    JOIN 
        marketing_db.institucion_egreso ie ON p.cod_institucion_e = ie.cod_institucion_e
    JOIN 
        marketing_db.profesiones pr ON p.cod_profesion = pr.cod_profesion
    JOIN 
        marketing_db.asesores ase ON ins.cod_asesor = ase.cod_asesor
         where pg.Cod_Programa = ?;
    `;
    conexion.query(sql, [codPrograma], (error, filas) => { // Pasar codPrograma como parámetro

        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        } else {
            res.send(filas);
        }
    });
});

// insertar una nueva persona y su inscripción
app.post('/api/add_person_and_inscription', (req, res) => {
    const personData = req.body;

    const sql = `CALL add_person_and_inscription(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
        personData.num_doc, personData.nombres, personData.apellidos, personData.genero, personData.fecha_nac,
        personData.domicilio, personData.telefono, personData.correo, personData.cod_ciudad_r,
        personData.cod_grado_a, personData.cod_institucion_e, personData.cod_profesion,
        personData.cod_programa, personData.cod_asesor
    ];

    conexion.query(sql, params, (error, results) => {
        if (error) {
            console.error('Error al ejecutar el procedimiento almacenado:', error);
            return res.status(500).send('Error interno del servidor');
        }
        res.send(results);
    });
});

// Subir los archivos
// Configuración de Multer(ruta del archivo)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Directorio donde se almacenan los archivos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
  });
  
var upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Subir imagen y guardar en fondo_programa
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { originalname, mimetype, size, filename } = req.file;
    const ruta = `/uploads/${filename}`;
    
    const query = 'INSERT INTO fondo_programa (Nombre_F, Ruta, Tipo, Tamano) VALUES (?, ?, ?, ?)';
    conexion.query(query, [originalname, ruta, mimetype, size], (error, results) => {
      if (error) {
        throw error;
      } else {
        res.send({ message: 'Imagen subida con éxito', id: results.insertId });
      }
    });
  });

  // Crear programa y asociar con imagen portada
  app.post('/api/programas', (req, res) => {
    const { nombre, fondoId } = req.body;
    
    const query = 'INSERT INTO programas (Nombre, Cod_Fondo_P) VALUES (?, ?)';
    conexion.query(query, [nombre, fondoId], (error, results) => {
      if (error) {
        throw error;
      } else {
        res.send({ message: 'Programa creado con éxito', id: results.insertId });
      }
    });
  });

  
// Busca la portada del programa
app.get('/api/portada_programa', (req, res) => {
    const codPrograma = req.query.Cod_Programa;
    if (!codPrograma) {
        return res.status(400).send('Falta el parámetro Cod_Programa');
    }
        const sql = `SELECT 
                p.Nombre,
                fp.*
                FROM 
                marketing_db.programas p
                JOIN 
                    marketing_db.fondo_programa fp
                ON 
                    p.Cod_Fondo_P = fp.Cod_Fondo_P
                WHERE 
                    p.Cod_Programa = ?
                ORDER BY 
                    fp.Cod_Fondo_P DESC
                LIMIT 1;`;
    conexion.query(sql, [codPrograma], (error, result) => { // Pasar codPrograma como parámetro
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.status(404).send('No se encontró la portada del programa');
        }
    });
});


/* Permite que las imágenes almacenadas en el directorio uploads puedan ser accedidas 
desde cualquier origen y configura el CORS*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
    }
}));

// Generar un enlace personalizado
app.post('/api/generar-url-pers', (req, res) => {
    const { codPrograma, nombre, codAsesor } = req.body;

    // Primero, verifica si ya existe un enlace para el programa y asesor
    const checkQuery = 'SELECT short_id FROM url_mapping WHERE cod_programa = ? AND cod_asesor = ?';
    conexion.query(checkQuery, [codPrograma, codAsesor], (checkError, checkResults) => {
        if (checkError) {
            console.error('Error al verificar la URL en la base de datos:', checkError);
            return res.status(500).send('Error interno del servidor');
        }

        // Si ya existe un enlace, devolver el existente
        if (checkResults.length > 0) {
            const existingShortId = checkResults[0].short_id;
            return res.send({ shortUrl: `https://mktlapaz.esam.edu.bo/${existingShortId}` });
        }

        // Si no existe, genera uno nuevo
        const customId = shortid.generate();
        const insertQuery = 'INSERT INTO url_mapping (short_id, cod_programa, nombre, cod_asesor) VALUES (?, ?, ?, ?)';
        conexion.query(insertQuery, [customId, codPrograma, nombre, codAsesor], (insertError, insertResults) => {
            if (insertError) {
                console.error('Error al guardar la URL en la base de datos:', insertError);
                return res.status(500).send('Error interno del servidor');
            }
            res.send({ shortUrl: `https://mktlapaz.esam.edu.bo/${customId}` });
        });
    });
});


// Redirigir al enlace completo
app.get('/:shortId', (req, res) => {
    const shortId = req.params.shortId;

    const query = 'SELECT cod_programa, nombre, cod_asesor FROM url_mapping WHERE short_id = ?';
    conexion.query(query, [shortId], (error, results) => {
        if (error) {
            console.error('Error al buscar la URL en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        if (results.length > 0) {
            const { cod_programa, nombre, cod_asesor } = results[0];
            res.redirect(`/formulario-inscripcion?Cod_Programa=${cod_programa}&Nombre=${encodeURIComponent(nombre)}&Cod_Asesor=${cod_asesor}`);
        } else {
            res.status(404).send('URL no encontrada');
        }
    });
});

app.get('/api/:shortId', (req, res) => {
    const shortId = req.params.shortId;

    const query = `SELECT 
    u.cod_programa, 
    u.nombre, 
    u.cod_asesor, 
    a.nombre AS nombre_asesor
    FROM 
        marketing_db.url_mapping u
    JOIN 
        marketing_db.asesores a
    ON 
        u.cod_asesor = a.cod_asesor
    WHERE 
        u.short_id = ?;`;
    conexion.query(query, [shortId], (error, results) => {
        if (error) {
            console.error('Error al buscar la URL en la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        if (results.length > 0) {
            const { cod_programa, nombre, cod_asesor,nombre_asesor } = results[0];
            res.json({ cod_programa, nombre, cod_asesor, nombre_asesor }); // Devuelve los datos en formato JSON
        } else {
            res.status(404).send('URL no encontrada');
        }
    });
});

app.put('/api/update_asesores/:cod_asesor', (req, res) => {
    const codAsesor = req.params.cod_asesor;
    const {
      nombre, estado, cargo, acceso_sis, correo_electronico, ci, extension, fecha_nac,
      domicilio, ciudad_rec, fecha_ingreso, entidad_financiera, num_celular, num_celular_P,
      equipo, tipo_contrato
    } = req.body;
  
    const sql = `
      UPDATE marketing_db.asesores
      SET nombre = ?, estado = ?, cargo = ?, acceso_sis = ?, correo_electronico = ?, ci = ?, extension = ?, fecha_nac = ?, domicilio = ?, ciudad_rec = ?, fecha_ingreso = ?, entidad_financiera = ?, num_celular = ?, num_celular_P = ?, equipo = ?, tipo_contrato = ?
      WHERE cod_asesor = ?;
    `;
  
    const values = [nombre, estado, cargo, acceso_sis, correo_electronico, ci, extension, fecha_nac, domicilio, ciudad_rec, fecha_ingreso, entidad_financiera, num_celular, num_celular_P, equipo, tipo_contrato, codAsesor];
  
    conexion.query(sql, values, (error, results) => {
      if (error) {
        console.error('Error al actualizar el asesor:', error);
        return res.status(500).send('Error interno del servidor');
      }
  
      res.send('Asesor actualizado exitosamente');
    });
  });
  
app.put('/api/asesores/:cod_asesor', (req, res) => {
    const codAsesor = req.params.cod_asesor;
    const { estado } = req.body;
  
    const sql = `
      UPDATE marketing_db.asesores
      SET estado = ?
      WHERE cod_asesor = ?;
    `;
  
    conexion.query(sql, [estado, codAsesor], (error, results) => {
      if (error) {
        console.error('Error al actualizar el estado:', error);
        return res.status(500).send('Error interno del servidor');
      }
  
      if (results.affectedRows === 0) {
        return res.status(404).send('Asesor no encontrado');
      }
  
      res.send('Estado actualizado exitosamente');
    });
  });
  
/*
const puerto = process.env.PUERTO || 3000;

app.listen(puerto,function()
{
    console.log("Servidor Ok en puerto:" + puerto);
});*/
const port = process.env.PORT || 3000;

app.listen(port, function() {
    console.log("Servidor Ok en puerto:" + port);
});