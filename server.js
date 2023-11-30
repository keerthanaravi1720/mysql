


// // Import required dependencies
// const express = require('express');
// const { PrismaClient } = require('@prisma/client');
// const mysql = require('mysql');

// // Create an instance of Prisma client
// const prisma = new PrismaClient();

// // Create an instance of Express
// const app = express();
// app.use(express.json());

// var con = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: '',
//   database: 'data_db'
// });

// con.connect((err) => {
//   if (err) throw err;
//   console.log('Connected to the database');
// });

// // Define the route to handle the POST request
// app.post('/user', (req, res) => {
//   let name = req.body.name;
//   let email = req.body.email;
//   let password = req.body.password;

//   let qr = `INSERT INTO users(name, email, password) VALUES ('${name}', '${email}', '${password}')`;
//   con.query(qr, (err, result) => {
//     if (err) {
//       res.send({ error: 'Operation failed' });
//     } else {
//       res.send({ success: 'Success' });
//     }
//   });
// });

// // Start the server
// app.listen(9000, () => {
//   console.log('Server is running on port 3000');
// });


const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(bodyParser.json());

// Middleware to authenticate the user
const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.substring(7); // Extract the token from the "Bearer " prefix

  try {
    const decodedToken = jwt.verify(token, 'secret_key');
    req.userId = decodedToken.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Create a new post
app.post('/posts', authenticateUser, async (req, res) => {
  const { title, content } = req.body;
  const userId = req.userId;

  try {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        userId,
      },
    });

    res.json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Retrieve a specific post
app.get('/posts/:id', authenticateUser, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to access this post' });
    }

    res.json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update an existing post
app.put('/posts/:id', authenticateUser, async (req, res) => {
  const postId = parseInt(req.params.id);
  const { title, content } = req.body;
  const userId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to update this post' });
    }

    const updatedPost = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        title,
        content,
      },
    });

    res.json({ message: 'Post updated successfully', post: updatedPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete an existing post
app.delete('/posts/:id', authenticateUser, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.userId;

  try {
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this post' });
    }

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });

    res.json({ message: 'Post has been deleted successfully' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

