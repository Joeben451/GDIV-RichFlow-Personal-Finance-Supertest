import request from "supertest";
import app from "../server.js";
import prisma from "../config/database.config.js";
import { resetDatabase } from "./utils/db.js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

describe("Auth API Integration Test", () => {
    beforeAll(async () => {
        await resetDatabase();
        // Seed currency first as it's required for user creation
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

    it("POST /api/auth/signup - should create a new user via API", async () => {
        const userData = {
            name: "TestUser",
            email: "api-test@example.com",
            password: "TestPass123",
            preferredCurrencyId: 1
        };

        const response = await request(app)
            .post("/api/auth/signup")
            .send(userData);

        expect(response.status).toBe(201);
        // Signup might not return a token, just success message
        expect(response.body).toHaveProperty("message");
        expect(response.body.user.email).toBe(userData.email);

        // Verify in DB
        const user = await prisma.user.findUnique({
            where: { email: userData.email },
        });
        expect(user).toBeTruthy();
    });

    it("POST /api/auth/login - should authenticate the user", async () => {
        const credentials = {
            email: "api-test@example.com",
            password: "TestPass123"
        };

        const response = await request(app)
            .post("/api/auth/login")
            .send(credentials);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty("accessToken");
    });
});

describe("Expense API Integration Test (Protected)", () => {
    let authToken: string;

    beforeAll(async () => {
        await resetDatabase();

        await prisma.currency.create({
            data: {
                id: 1,
                cur_symbol: "$",
                cur_name: "USD",
            },
        });

        // 1. Create User
        await request(app)
            .post("/api/auth/signup")
            .send({
            name: "TestPerson",
            email: "onetwo@gmail.com",
            password: "IrohaLessthanthree3",
            preferredCurrencyId: 1
        })

        // 2. Login & Get Token
        const loginRes = await request(app).post("/api/auth/login")
            .send({
                email: "onetwo@gmail.com",
                password: "IrohaLessthanthree3"
            });
        authToken = loginRes.body.accessToken

        // 3. Get User ID from DB
        const user = await prisma.user.findUnique({
            where: { email: "onetwo@gmail.com" }
        })

        // 4. Create IncomeStatement (Required Dependency)
        const existingStatement = await prisma.incomeStatement.findUnique({
            where: { userId: user!.id }
        });

        if (!existingStatement) {
            await prisma.incomeStatement.create({
                data: {
                    userId: user!.id
                }
            });
        }
    });
    
    afterAll(async () => {
        await prisma.$disconnect();
    });

    // Happy Path
    it("Post /api/expenses - should create a new expense", async () => {
        const expenseData = {
            name: "House in Mambusao",
            amount: 150000.20
        };

        // 5. Send Request with Auth Token
        const response = await request(app)
            .post("/api/expenses")
            .set("Authorization", `Bearer ${authToken}`)
            .send(expenseData)

        if (response.status !== 201) {
            console.log("Error Response Body: ", response.body);
        }
        
        // 6. Verify Response
        expect(response.status).toBe(201);
        expect(response.body).toBeDefined();
        
        expect(response.body.expense.name).toBe(expenseData.name);
        expect(Number(response.body.expense.amount)).toBe(expenseData.amount);
    });

    // Sad Path
    it("POST /api/expenses - should fail if amount is negative", async () => {
            const expenseData = {
                name: "Horse",
                amount: -630.00
            };

            const response = await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${authToken}`)
                .send(expenseData);

            expect(response.status).toBe(400);
    });

    // Happy Path
    it("DELETE /api/expenses/:id - should delete a given expense",  async () => {
            const expenseData = {
                name: "Fortnite Battle Pass",
                amount: 1500.00
            };

            const response = await request(app)
                .post("/api/expenses")
                .set("Authorization", `Bearer ${authToken}`)
                .send(expenseData);

            const expenseId = response.body.expense.id;

            const deleteResponse = await request(app)
                .delete(`/api/expenses/${expenseId}`)
                .set("Authorization", `Bearer ${authToken}`)

            expect(deleteResponse.status).toBe(200);

            const deletedExpense = await prisma.expense.findUnique({
                where: { id: expenseId }
            });
            expect(deletedExpense).toBeNull();
    });
});
