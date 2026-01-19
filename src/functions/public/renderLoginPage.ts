import type { Context, APIGatewayProxyStructuredResultV2, APIGatewayProxyEventV2, Handler } from "aws-lambda";

export const handler: Handler = async (_event: APIGatewayProxyEventV2, _context: Context): Promise<APIGatewayProxyStructuredResultV2> => {
    const designationId = _event.pathParameters?.designationId;
    const frontendUrl = process.env.FRONTEND_URL || "";

    if (!designationId) {
        return {
            statusCode: 400,
            body: "Designation ID is required",
        };
    }

    const html = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TPE Digital - Acessar Designação</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #F8F8F8; }
        .tpe-primary { background-color: #374192; }
        .tpe-primary:hover { background-color: #46607F; }
        .tpe-text-primary { color: #374192; }
        .tpe-border-secondary { border-color: #929BD2; }
    </style>
</head>
<body class="flex items-center justify-center min-vh-100 min-h-screen p-4">
    <div class="w-full max-w-md bg-white rounded-lg shadow-sm p-8 border border-gray-100">
        <div class="text-center mb-8 flex flex-col items-center">
            <img src="https://app.tpedigital.com.br/logo.png" alt="TPE Digital Logo" class="h-24 mb-4">
            <p class="text-sm text-gray-500">Digite seu telefone para ver sua designação</p>
        </div>

        <form id="loginForm" class="space-y-6">
            <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" id="phone" name="phone" placeholder="(00) 00000-0000" required
                    class="w-full px-4 py-3 rounded-md border tpe-border-secondary focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all">
            </div>

            <button type="submit" id="submitBtn"
                class="w-full tpe-primary text-white font-medium py-3 rounded-md transition-colors flex items-center justify-center">
                <span>Ver Minha Designação</span>
                <svg id="loadingIcon" class="hidden animate-spin ml-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </button>
            <p id="errorMessage" class="hidden text-red-500 text-sm text-center mt-4"></p>
        </form>
    </div>

    <script>
        const form = document.getElementById('loginForm');
        const phoneInput = document.getElementById('phone');
        const submitBtn = document.getElementById('submitBtn');
        const loadingIcon = document.getElementById('loadingIcon');
        const errorMessage = document.getElementById('errorMessage');

        // Máscara de telefone simples
        phoneInput.addEventListener('input', (e) => {
            let x = e.target.value.replace(/\\D/g, '').match(/(\\d{0,2})(\\d{0,5})(\\d{0,4})/);
            e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.classList.add('hidden');
            loadingIcon.classList.remove('hidden');
            submitBtn.disabled = true;

            const phone = phoneInput.value.replace(/\\D/g, '');
            
            try {
                const response = await fetch(window.location.pathname + '/lookup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });

                const data = await response.json();

                if (response.ok) {
                    const redirectUrl = \`${frontendUrl}/designacao/${designationId}/\${data.participantId}\`;
                    window.location.href = redirectUrl;
                } else {
                    errorMessage.textContent = data.message || 'Erro ao buscar designação';
                    errorMessage.classList.remove('hidden');
                }
            } catch (err) {
                errorMessage.textContent = 'Erro de conexão. Tente novamente.';
                errorMessage.classList.remove('hidden');
            } finally {
                loadingIcon.classList.add('hidden');
                submitBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
  `;

    return {
        statusCode: 200,
        headers: {
            "Content-Type": "text/html",
        },
        body: html,
    };
};
