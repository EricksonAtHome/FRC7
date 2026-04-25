import chalk from 'chalk';
import OpenAI from 'openai';
import Docker from 'dockerode';

const docker = new Docker();

export async function executeScript(script) {
    const lines = script.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let context = {
        env: "prod",
        network: { core: {}, mobile: {} },
        docker: null,
        model: null,
        result: null
    };

    renderBiosHeader();

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("set env")) {
            context.env = line.match(/"(.+?)"/)?.[1] || "prod";
            logSystem(`ENV`, `Environment establishes as ${chalk.bold(context.env)}`);
        }

        if (line.startsWith("network")) {
            const netType = line.split(" ")[1];
            let netConfig = {};
            let j = i + 1;
            while (j < lines.length && !lines[j].includes("}")) {
                const parts = lines[j].split(/\s+/);
                if (parts.length >= 2) {
                    const key = parts[0];
                    const val = parts[1].replace(/"/g, '');
                    netConfig[key] = val;
                }
                j++;
            }
            i = j;
            context.network[netType === "frc.systems" ? "core" : "mobile"] = netConfig;
            logSystem(`NET`, `Configured ${netType} (${netConfig.type || 'SECURE'})`);
        }

        if (line.startsWith("docker")) {
            let dockerConfig = { name: line.match(/"(.+?)"/)?.[1] };
            let j = i + 1;
            while (j < lines.length && !lines[j].includes("}")) {
                const parts = lines[j].split(/\s+/);
                if (parts.length >= 2) {
                    const key = parts[0];
                    const val = parts[1].replace(/"/g, '');
                    dockerConfig[key] = val;
                }
                j++;
            }
            i = j;
            context.docker = dockerConfig;
            logSystem(`ORCH`, `Orchestrating container ${chalk.green(dockerConfig.image)}`);
        }

        if (line.startsWith("use model")) {
            context.model = line.match(/"(.+?)"/)?.[1];
            logSystem(`AI`, `Loading model: ${chalk.cyan(context.model)}`);
        }

        if (line.startsWith("run model")) {
            let input = "";
            if (line.includes("input")) {
                input = line.match(/input\s+"(.+?)"/)?.[1];
            } else if (lines[i+1]?.includes("input")) {
                input = lines[i+1].match(/input\s+"(.+?)"/)?.[1];
            }
            logSystem(`EXEC`, `Processing AI request...`);
            context.result = `[FRC-ORCHESTRATOR] Result for model ${context.model}`;
            if (lines[i+1]?.includes("input")) i++;
            if (lines[i+1]?.includes("}")) i++;
        }

        if (line.startsWith("print")) {
            console.log(chalk.black.bgWhite(` OUTPUT `), chalk.white(context.result));
        }
    }

    renderSystemMap(context);
    return context;
}

function renderBiosHeader() {
    console.log(chalk.blue.bold(`
┌──────────────────────────────────────────────────────────┐
│ FRC SYSTEMS BIOS v2.0 (c) 2026 - Telebey Orchestrator    │
│ CPU: Virtualized AI Core | RAM: Distributed Net Layer   │
└──────────────────────────────────────────────────────────┘`));
}

function logSystem(tag, msg) {
    console.log(chalk.gray(`[${tag.padEnd(5)}]`), msg);
}

function renderSystemMap(ctx) {
    console.log(chalk.green(`
SYSTEM RUNTIME MAP:
📍 Environment: ${chalk.bold(ctx.env)}
📶 Net Protocol: ${chalk.bold(ctx.network.core.protocol || 'FRC')}
📡 5G Provider: ${chalk.bold(ctx.network.mobile.provider || 'AUTO')}
🐳 Docker Image: ${chalk.bold(ctx.docker?.image || 'NONE')}
🧠 AI Context:  ${chalk.bold(ctx.model || 'NONE')}
`));
}
