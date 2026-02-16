import dotenv from "dotenv";
import prisma from "../config/database.config.js";
import { resetDatabase } from "./utils/db.js";

dotenv.config({ path: ".env.test" });

describe("Database Integration Test", () => {
    beforeAll(async () => {
        await resetDatabase();

        await prisma.currency.create({
            data: {
                id: 1,
                cur_symbol: "$",
                cur_name: "USD",
            },
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it("should add another user to the database", async () => {
        const email = "testuser+1@example.com";

        await prisma.user.create({
            data: {
                name: "TestUser",
                email,
                password: "TestPass123",
                updatedAt: new Date(),
                preferredCurrencyId: 1,
            },
        });

        const user = await prisma.user.findUnique({
            where: { email },
        });

        expect(user).toBeTruthy();
        expect(user?.email).toBe(email);
    });
});