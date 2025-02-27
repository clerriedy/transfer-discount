document.getElementById("apply-discount").addEventListener("click", async () => {
    try {
      const response = await fetch("/create-discount", { method: "POST" });
      const data = await response.json();

      console.log(data);

      alert("Descuento aplicado: " + data.discount_code.code);
    } catch (error) {
      alert("Error al aplicar el descuento: " + error.message);
    }
  });