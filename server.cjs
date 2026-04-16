(async () => {
  const appModule = await import("./app.js");
  const app = appModule.default;

  const PORT = process.env.PORT || 3000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log("🚀 Server running on port", PORT);
  });
})();