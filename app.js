var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var multer = require('multer');
var path = require('path');
var WebSocket = require('ws');

var app = express();
app.use(express.json());
app.use(cors());



//  Especiica el origen exacto (recomendado para producción)
var corsOptions = {
    origin: 'http://localhost:5173',  // Asegúrate que este sea el puerto y protocolo donde se ejecuta tu cliente Vue.js
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// parametros para la conexion
var conexion = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'',
    database:'marketing_db'
});


const wss = new WebSocket.Server({ port: 8080 });
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
    res.send('ruta INICIO')
})

// mostrar todos las programas
app.get('/api/programas',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.programas;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

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

  // Crear programa y asociar con imagen
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
  

// Insertar los datos del certificado en la base de datos y actualiza la tabla inscripcion
app.post('/api/certificado_conclusion',upload.single('file'), (req, res) => {
    const { Cod_Estudiante, Estudiante, CargaHoraria } = req.body;
    const FechaGeneracion = new Date();

    const archivoPath = `uploads/${req.file.filename}`;

        const sqlInsertCertificado = `
            INSERT INTO marketing_db.fondo_programa
            (Estudiante, ArchivoCertificado, CargaHoraria, FechaGeneracion) 
            VALUES (?, ?, ?, ?)
        `;

        conexion.query(sqlInsertCertificado, [Estudiante, archivoPath, CargaHoraria, FechaGeneracion], (error, results) => {
            if (error) {
                console.error('Error al insertar el certificado:', error);
                return res.status(500).send('Error al insertar el certificado');
            }

            const Cod_Certificado_C = results.insertId;
            const sqlUpdateInscripcion = `
                UPDATE marketing_db.programas 
                SET Cod_Fondo_P = ? 
                WHERE Cod_Programa = ?
            `;

            conexion.query(sqlUpdateInscripcion, [Cod_Certificado_C, Cod_Estudiante], (error, results) => {
                if (error) {
                    console.error('Error al actualizar la inscripción:', error);
                    return res.status(500).send('Error al actualizar la inscripción');
                }
                  // Enviar mensaje a todos los clientes WebSocket
                    wss.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ Cod_Estudiante }));
                        }
                    });
                res.status(201).send({ message: 'Certificado insertado y inscripción actualizada correctamente', id: Cod_Certificado_C });
            });
        });
});
// Busca la portada del programa
app.get('/api/fondo_certificados', (req, res) => {
    const codPrograma = 2;
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
    conexion.query(sql, (error, result) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.status(404).send('No se encontró el fondo del certificado');
        }
    });
});
// mostrar los estudiantes con inscripcion que tienen un certificado de conclusion asignado.
app.get('/api/buscar-estudiante-certificado-conclusion',(req,res) =>{
    const query = `
    SELECT 
    estudiante.Cod_Estudiante,
    estudiante.Carnet,
    estudiante.Nombre,
    estudiante.Apellido,
    inscripcion.Cod_Inscripcion,
    inscripcion.Cod_Programa,
    inscripcion.fechaInscripcion,
    certificado_conclusion.Cod_Certificado_C,
    certificado_conclusion.Estudiante AS Estudiante_Certificado,
    certificado_conclusion.FechaGeneracion,
    certificado_conclusion.ArchivoCertificado,
    certificado_conclusion.CargaHoraria
FROM 
    seguimiento_db.estudiante AS estudiante
JOIN 
    seguimiento_db.inscripcion AS inscripcion ON estudiante.Cod_Estudiante = inscripcion.Cod_Estudiante
JOIN 
    seguimiento_db.certificado_conclusion AS certificado_conclusion ON inscripcion.Cod_Certificado_C = certificado_conclusion.Cod_Certificado_C
    WHERE 
    inscripcion.Cod_Certificado_C IS NOT NULL;
    `;
        conexion.query(query, (error, resultados)=>{
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }

        if (resultados.length > 0) {
            res.send(resultados);
        } else {
            res.status(404).send('Certificados con inscripcion no encontrados');
        }
    })
})

// mostrar si se genero  certificado de un estudiante
app.get('/api/verificar-certificado-conclusion/:cod_programa', (req, res) => {
    const codPrograma = req.params.cod_programa;
    const query = `
        SELECT Cod_Fondo_P
        FROM marketing_db.programas
        WHERE Cod_Programa = ? AND Cod_Fondo_P IS NOT NULL
    `;

    conexion.query(query, [codPrograma], (error, results) => {
        if (error) {
            console.error('Error al verificar el certificado:', error);
            return res.status(500).send('Error al verificar el certificado');
        }

        if (results.length > 0) {
            res.send({ certificadoGenerado: true });
        } else {
            res.send({ certificadoGenerado: false });
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

const puerto = process.env.PUERTO || 3000;

app.listen(puerto,function()
{
    console.log("Servidor Ok en puerto:" + puerto);
});