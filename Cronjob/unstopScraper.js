import puppeteer from "puppeteer";
import cron from "node-cron";
import crypto from "crypto";
// Corrected import path to use the 'Opportunity' model
import Opportunity from "../Models/opportunity.js";

// Scraper Function
async function scrape() {
    console.log("Starting scrape...");
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const url = "https://unstop.com/all-opportunities";
    
    // Auto-scroll helper function
    async function autoScroll(page) {
        await page.evaluate(async () => {
            await new Promise((resolve, reject) => {
                let totalHeight = 0;
                const distance = 100;
                const timer = setInterval(() => {
                    const scrollHeight = document.body.scrollHeight;
                    window.scrollBy(0, distance);
                    totalHeight += distance;
                    // Stop scrolling when the bottom of the page is reached
                    if (totalHeight >= scrollHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 200);
            });
        });
    }

    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await autoScroll(page);
        const opportunities = await page.evaluate(() => {
            const items = document.querySelectorAll("app-competition-listing, app-featured-opportunity-tile");
            const data = [];
            items.forEach((item) => {
                try {
                    const contentDiv = item.querySelector(".content");
                    if (!contentDiv) return;

                    const titleEl = contentDiv.querySelector(".opp-title h2.double-wrap");
                    const title = titleEl?.innerText.trim() || null;
                    const orgEl = contentDiv.querySelector("p");
                    const org = orgEl?.innerText.trim() || null;
                    const tagEl = contentDiv.querySelector(".tag-container .un_tag .tag-text");
                    const typeTag = tagEl?.innerText.trim() || null;
                    const regEl = item.querySelector(".other_fields .seperate_box:first-child");
                    const registeredText = regEl?.innerText.trim() || "";
                    const registeredMatch = registeredText.match(/(\d+)/);
                    const registered = registeredMatch ? parseInt(registeredMatch[1], 10) : null;
                    const daysEl = item.querySelector(".other_fields .seperate_box:nth-child(2)");
                    const daysText = daysEl?.innerText.trim() || "";
                    const daysMatch = daysText.match(/(\d+)/);
                    const days_left = daysMatch ? parseInt(daysMatch[1], 10) : null;
                    const chipEls = item.querySelectorAll(".skills .skill_list .chip_text");
                    const skills = Array.from(chipEls).map(c => c.innerText.trim());
                    const imgEl = item.querySelector(".img img");
                    const image = imgEl?.src || null;
                    
                    data.push({
                        id: null, // Set the ID to null to be populated later
                        title,
                        organizer: org,
                        type: typeTag,
                        registered,
                        days_left,
                        skills,
                        image,
                    });
                } catch(e) {
                    console.error("Error parsing item", e);
                }
            });
            return data;
        });

        console.log(`Scraped ${opportunities.length} opportunities.`);

        // Generate a unique ID for each opportunity before processing
        const opportunitiesWithIds = opportunities.map(opp => {
            // Generate a random UUID for the ID
            opp.id = crypto.randomUUID();
            return opp;
        });

        for (const opp of opportunitiesWithIds) {
            // Check if the title is valid before attempting to update/insert
            if (opp.title) {
                // Use the title as the unique key to prevent duplicate records
                await Opportunity.findOneAndUpdate(
                    { title: opp.title },
                    { $set: opp },
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                console.log("Processing opportunity:", opp);
            } else {
                console.warn("Skipping opportunity due to missing title:", opp);
            }
        }
        
        console.log("Database updated successfully.");
    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        await browser.close();
    }
}

// Export the cron job start function and the initial scrape function
// Converted from CommonJS to ES Module export syntax
export default () => {
    // Schedule the Scrape Function with a Cron Job
    cron.schedule('0 */12 * * *', () => { // Run every 12 hours
        console.log("Running scheduled scrape...");
        scrape().catch(err => {
            console.error("Scheduled scrape failed:", err);
        });
    });
    // Trigger the scraper immediately on startup
    scrape().catch(err => {
        console.error("Initial scrape failed:", err);
    });
};
