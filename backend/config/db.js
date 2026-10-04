const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const database = mongoose.connection.db;
        const hasLegacyGroups = await database
            .listCollections({ name: "grouporders" }, { nameOnly: true })
            .hasNext();
        const hasGroups = await database
            .listCollections({ name: "groups" }, { nameOnly: true })
            .hasNext();

        if (hasLegacyGroups && !hasGroups) {
            await database.collection("grouporders").rename("groups");
        } else if (hasLegacyGroups && hasGroups) {
            const legacyGroups = database.collection("grouporders");
            const groups = database.collection("groups");

            for await (const group of legacyGroups.find()) {
                const { _id, ...groupData } = group;
                await groups.updateOne(
                    { _id },
                    { $setOnInsert: groupData },
                    { upsert: true }
                );
            }

            await legacyGroups.drop();
        }

        console.log("MongoDB Connected");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;