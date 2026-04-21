import type { PageServerLoad, Actions } from './$types';
import { themes } from '$lib/themes';

export const load: PageServerLoad = async ({ parent }) => {
    const { theme } = await parent();
    return { theme };
};

export const actions: Actions = {
    changeTheme: async ({ request, cookies }) => {
        const formData = await request.formData();
        const theme = formData.get("theme") ?? ""

        if (theme === null || typeof theme !== 'string'){
            return;
        }

        if (!themes.includes(theme)){
            return;
        }

        cookies.set("theme", theme, {path : '/'})

        return { success : theme}
    }
}