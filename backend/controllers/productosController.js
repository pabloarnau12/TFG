const connection = require("../config/db");
const cloudinary = require("cloudinary").v2;

exports.getAllProductos = (req, res) => {
  connection.query("SELECT * FROM productos", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
};

exports.getProductoById = (req, res) => {
  const { id } = req.params;
  connection.query(
    "SELECT * FROM productos WHERE ID_Producto = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      if (results.length === 0)
        return res.status(404).send("Producto no encontrado");
      res.json(results[0]);
    }
  );
};

exports.getProductosByTienda = (req, res) => {
  const { id } = req.params;
  connection.query(
    "SELECT * FROM productos WHERE ID_Establecimiento = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
};

exports.addProducto = (req, res) => {
  const {
    ID_Establecimiento,
    Nombre,
    Descripcion,
    Precio,
    Disponibilidad,
    Tipo,
  } = req.body;
  const file = req.file;

  const checkQuery =
    "SELECT * FROM productos WHERE Nombre = ? AND ID_Establecimiento = ?";
  connection.query(checkQuery, [Nombre, ID_Establecimiento], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length > 0) {
      return res
        .status(400)
        .json({ message: "El nombre del producto ya existe en esta tienda" });
    }

    cloudinary.uploader.upload(
      file.path,
      { folder: "products", public_id: `${Nombre}_${ID_Establecimiento}` },
      (err, result) => {
        if (err) {
          console.error("Error al subir la imagen a Cloudinary:", err);
          return res.status(500).json({ message: "Error al subir la imagen" });
        }

        const imageUrl = result.secure_url;

        const query =
          "INSERT INTO productos (ID_Establecimiento, Nombre, Descripcion, Precio, Disponibilidad, Foto, Tipo) VALUES (?, ?, ?, ?, ?, ?, ?)";
        connection.query(
          query,
          [
            ID_Establecimiento,
            Nombre,
            Descripcion,
            Precio,
            Disponibilidad,
            imageUrl,
            Tipo,
          ],
          (err, results) => {
            if (err) return res.status(500).send(err);
            res.status(201).json({
              message: "Producto añadido con éxito",
              productoID: results.insertId,
            });
          }
        );
      }
    );
  });
};

exports.deleteProductoByID = (req, res) => {
  const { ID_Producto, ID_Establecimiento } = req.params;
  connection.query(
    "DELETE FROM productos WHERE ID_Producto = ? AND ID_Establecimiento = ?",
    [ID_Producto, ID_Establecimiento],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json(results);
    }
  );
};

exports.updateProducto = (req, res) => {
  const { id } = req.params;
  const { Nombre, Descripcion, Precio, Disponibilidad, Tipo, Foto } = req.body;

  if (!Nombre || !Descripcion || !Precio || !Disponibilidad || !Tipo) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios." });
  }

  const query = `
    UPDATE productos
    SET Nombre = ?, Descripcion = ?, Precio = ?, Disponibilidad = ?, Tipo = ?, Foto = ?
    WHERE ID_Producto = ?
  `;

  connection.query(
    query,
    [Nombre, Descripcion, Precio, Disponibilidad, Tipo, Foto, id],
    (err, results) => {
      if (err) {
        console.error("Error al actualizar el producto:", err);
        return res
          .status(500)
          .json({ message: "Error al actualizar el producto." });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Producto no encontrado." });
      }

      res.status(200).json({ message: "Producto actualizado con éxito." });
    }
  );
};
