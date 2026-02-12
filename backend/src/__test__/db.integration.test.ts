import request from "supertest";
import app from "../server";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

describe("Database Integration Test", () => {
    it("should fetch all users from the database", async () => {
        
    })
})