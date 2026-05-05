<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lavanda & Vida Saludable</title>
    <style>
        :root {
            --lavanda-primary: #967bb6;
            --lavanda-dark: #663399;
            --soft-gray: #f4f4f9;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            background-color: var(--soft-gray);
        }
        header {
            background-color: var(--lavanda-primary);
            color: white;
            padding: 1rem;
            text-align: center;
        }
        nav {
            display: flex;
            justify-content: center;
            background: white;
            padding: 10px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        nav a {
            margin: 0 15px;
            text-decoration: none;
            color: var(--lavanda-dark);
            font-weight: bold;
        }
        .hero {
            text-align: center;
            padding: 50px 20px;
            background: linear-gradient(rgba(150, 123, 182, 0.2), rgba(255, 255, 255, 1));
        }
        .container {
            max-width: 1000px;
            margin: 20px auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
        }
        .card-content {
            padding: 15px;
        }
        footer {
            text-align: center;
            padding: 20px;
            font-size: 0.8rem;
            color: #777;
        }
    </style>
</head>
<body>

    <header>
        <h1>Aroma de Bienestar</h1>
    </header>

    <nav>
        <a href="#inicio">Inicio</a>
        <a href="#beneficios">Beneficios</a>
        <a href="#cuidados">Cuidados</a>
        <a href="login.html">Admin</a> </nav>

    <section class="hero">
        <h2>El Crecimiento de la Lavanda</h2>
        <p>Descubre cómo cultivar y aprovechar las bondades de esta planta milenaria.</p>
    </section>

    <main class="container" id="content-area">
        <article class="card">
            <img src="https://via.placeholder.com/400x200" alt="Lavanda">
            <div class="card-content">
                <h3>Cuidado Básico</h3>
                <p>La lavanda necesita mucho sol y un suelo bien drenado para florecer...</p>
            </div>
        </article>
    </main>

    <footer>
        &copy; 2024 Proyecto Lavanda & Ciencias - Equipo de Desarrollo
    </footer>

    <script>
        // Aquí irá su lógica para conectar con la API
        console.log("Listo para cargar datos de la API");
    </script>
</body>
</html>
