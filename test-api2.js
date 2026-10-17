fetch('http://localhost:3000/api/listings?ts=' + Date.now())
  .then(async r => {
    console.log("Status:", r.status);
    const text = await r.text();
    console.log("Response:", text);
  })
  .catch(console.error);
