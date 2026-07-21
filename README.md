# Neo Genesis

Controle de iluminação independente para o teclado **HyperX Mars** (`VID 0951`, `PID 16C6`). O Neo Genesis comunica-se diretamente com o dispositivo via HID no Windows; não requer HyperX Genesis, NGENUITY, bridge ou DLL externa.

## Recursos

- efeitos Onda RGB, Loading de cor, Sólida, Ciclo de cores e Batimento;
- brilho, velocidade, direção e repetição quando suportados pelo firmware;
- dez perfis locais;
- pintura personalizada por tecla e pela barra de LEDs;
- gravação direta na memória do teclado;
- keepalive para manter o efeito Batimento em movimento.

## Uso

1. Feche outros programas que possam controlar o teclado.
2. Abra `src-tauri\\target\\release\\neo-genesis.exe`.
3. Escolha um efeito ou pinte teclas no cartão **Personalizado por tecla**.
4. Clique em **Aplicar no Mars** ou **Aplicar por tecla**.

Não desconecte o teclado enquanto uma gravação estiver em andamento. Para o efeito Batimento, mantenha o Neo Genesis aberto ou minimizado, pois o firmware precisa do keepalive do aplicativo.

## Desenvolvimento

Pré-requisitos: Node.js, Rust estável, ferramentas C++ do Visual Studio e WebView2 Runtime.

```powershell
npm install
npm run tauri dev
```

Verificações locais:

```powershell
npm test
npm run build
cargo check --manifest-path src-tauri\\Cargo.toml
cargo test --manifest-path src-tauri\\Cargo.toml
```

Build de produção:

```powershell
npm run tauri build
```

O executável é gerado em `src-tauri\\target\\release\\neo-genesis.exe`. O Windows pode exibir um aviso porque o binário não possui assinatura digital. O WebView2 Runtime normalmente já está presente no Windows 10 e 11.

## Limites conhecidos

- O suporte é específico para o HyperX Mars `0951:16C6`.
- Apenas a iluminação está implementada; macros, remapeamento e modo jogo não fazem parte do app.
- As cores do modo personalizado são salvas localmente e não são separadas por perfil.
- A versão atual é exclusiva para Windows.

Este projeto não é afiliado nem endossado pela HyperX.
