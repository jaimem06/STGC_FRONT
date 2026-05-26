import { createInstance } from "./axios-config";
import { ENDPOINTS } from "./endpoints";

export const api = createInstance(ENDPOINTS.AUTH.BASE_URL);
