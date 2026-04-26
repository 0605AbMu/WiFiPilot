import { ACT, authenticate, execute } from "@hertzg/tplink-api";

const auth = await authenticate("http://192.168.0.1", {
  password: "admin123",
});

if (auth) {
  const result = await execute(
    "http://192.168.1.1",
    [[ACT.GET, "LTE_BANDINFO"]],
    auth,
  );
  // result.error === 0 indicates success
  // result.actions[0].res contains the response data
}