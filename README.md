<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tarjeta Glassmorphism</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: linear-gradient(45deg, #ff9a9e 0%, #fad0c4 99%, #fad0c4 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .container {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .card {
            width: 300px;
            height: 400px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.18);
            display: flex;
            flex-direction: column;
            padding: 20px;
            color: #fff;
            text-align: center;
        }

        .card h2 {
            margin-top: 20px;
            font-size: 1.5rem;
        }

        .card p {
            font-size: 1rem;
            margin-top: 10px;
            opacity: 0.8;
        }

        .button {
            margin-top: auto;
            padding: 10px;
            border: none;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.3);
            color: white;
            cursor: pointer;
            transition: 0.3s;
            text-decoration: none;
        }

        .button:hover {
            background: rgba(255, 255, 255, 0.5);
        }
    </style>
</head>
<body>

    <div class="container">
        <div class="card">
            <h2>Código Aleatorio</h2>
            <p>Este es un ejemplo de diseño Glassmorphism creado solo con HTML y CSS. Se ve genial en cualquier portafolio moderno.</p>
            <a href="#" class="button">¡Haz clic aquí!</a>
        </div>
    </div>

</body>
</html>
