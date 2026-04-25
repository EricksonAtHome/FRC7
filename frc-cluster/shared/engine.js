export function execute(code) {
  return {
    output: `[FRC NODE EXECUTED] ${code}`,
    status: "success",
    latency: Math.floor(Math.random() * 20) + "ms"
  };
}
