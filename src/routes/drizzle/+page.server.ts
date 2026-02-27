import type { Actions, PageServerLoad } from "./$types";
import { db } from "$lib/server/db";
import { usersTable } from "$lib/server/db/schema";
import { fail } from "@sveltejs/kit";

export const load: PageServerLoad = async () => {
  const users = await db.select().from(usersTable);

  return { users };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const formData = await request.formData();

    const name = formData.get("name");
    const age = Number(formData.get("age"));
    const email = formData.get("email");

    if (!name || !email || !age) {
      return fail(400, { error: "All fields are required" });
    }

    try {
      await db.insert(usersTable).values({
        name: String(name),
        age,
        email: String(email)
      });
    } catch (err) {
      return fail(400, {
        error: "Email must be unique"
      });
    }

    return { success: true };
  }
};