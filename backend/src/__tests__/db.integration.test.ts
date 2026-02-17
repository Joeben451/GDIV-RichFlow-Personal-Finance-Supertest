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

    //Happy Path
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

    // Sad Path
    it("POST /api/auth/signup - should return 409 for duplicate email", async () => {
            await prisma.user.create({data: {name: "Anotherme", email: "duplicate@example.com", password: "SomeSecurePassword123", preferredCurrencyId: 1, updatedAt: new Date() }});

            const double = {
                name: "TestUser2",
                email: "duplicate@example.com",
                password: "TestPass123"
            };

            const response = await request(app)
                .post("/api/auth/signup")
                .send(double);

            expect(response.status).toBe(409);
            expect(response.body?.error).toBe("An account with this email already exists");

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

describe("Income API Integration Test (Protected)", () => {
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
    it("POST /api/income - should post create a new income statement", async () => {
        const incomeData = {
            name: "Trabaho",
            amount: 12000.00,
            type: "Earned",
            quadrant: "EMPLOYEE"
        };

        const response = await request(app)
            .post("/api/income")
            .set("Authorization", `Bearer ${authToken}`)
            .send(incomeData);

        if (response.status !== 201) {
            console.log("Error Response:", response.body);
        }

        // 1. Status Check
        expect(response.status).toBe(201); 

        // 2. Structure Check
        expect(response.body).toHaveProperty("incomeLine");
        
        // 3. Data Integrity Check
        expect(response.body.incomeLine.name).toBe(incomeData.name);
        expect(Number(response.body.incomeLine.amount)).toBe(incomeData.amount);
        expect(response.body.incomeLine.type).toBe(incomeData.type);
        expect(response.body.incomeLine.quadrant).toBe(incomeData.quadrant);

    });

    // Sad Path
    it("PUT /api/income/:id - should fail updating if amount is negative", async () => {
        // 1. Create valid income entry 
        const initialIncome = {
            name: "Secret",
            amount: 500,
            type: "Earned",
            quadrant: "SELF_EMPLOYED"
        };

        const response = await request(app)
            .post("/api/income")
            .set("Authorization", `Bearer ${authToken}`)
            .send(initialIncome);
        
        // 2. Capture the ID of the created income
        const incomeId = response.body.incomeLine.id;

        // 3. Attempt to update with an invalid negative amount
        const updatedData = {
            name: "Freelance",
            amount: -1,
            type: "Earned",
            quadrant: "SELF_EMPLOYED"
        };

        const update = await request(app)
            .put(`/api/income/${incomeId}`)
            .set("Authorization", `Bearer ${authToken}`)
            .send(updatedData);

        // 4. Expect Bad Request (400)
        expect(update.status).toBe(400);
    });

    // Sad Path
    it("POST /api/income - should fail if amount is negative", async () => {
        const incomeData = {
            name: "Horse",
            amount: -630.00,
            type: "Passive"
        };

        const response = await request(app)
            .post("/api/income")
            .set("Authorization", `Bearer ${authToken}`)
            .send(incomeData);

        expect(response.status).toBe(400);
    })
});
