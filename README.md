# Min projektidé

### Projektnamn:

NAME_OF_PROJECT

### Målgrupp:

Internet Dwellers

### Huvudsyfte:

Chatta, socialisera, spela

### Varför valde jag detta:

Främst för att lära mig websockets, men också för att multiplayer är kul.

### Inspiration:
jklm.fun, skribbl.io, Discord, Whatsapp, geoguesser

# Teknisk implementation för [Ditt projekt]

## 1. Dynamisk routing

**Vilka sidor/routes kommer jag ha:**

- / (startsida, publik)
- /rooms
- /rooms/[roomId] (specifikt rum med realtidsdata)
- /profile/[id] (publik användarprofil och galleri)
- /settings (kontoinställningar)
- /character (character customization page)
- /login, /blog, /contact (public pages)

**Exempel på dynamiska parametrar:** /rooms/[id], /profile/[username]

## 2. Databasmodeller

**Vilka huvudsakliga data-typer behöver jag:**

- User (name, email, password_hash, profile_pic, description, created_at)
- GalleryImage (user_id, url, caption, uploaded_at)

## 3. Databasrelationer

**Hur är min data kopplad:**

- User har många GalleryImages (one-to-many)
- User

## 4. Inloggning

**Vad kan inloggade användare göra som ej-inloggade inte kan:**

- Rum med bestämt namn (annars random namn och profil)
- Profiler (redigera sin egen, skicka vänförfrågningar, lägga upp
  profilbild, customiza sin profilsida)
- Inställningar (ändra lösenord, email, profilbild)
- Character Customization, 

## 5. Kryptering

**Vilken känslig data behöver skyddas:**

- Lösenord BetterAuth
- Session tokens
- Email-adresser

## 6. Hosting i molnet

**Var planerar jag deploya:**

- <a href="https://render.com">render.com</a> (backend + SvelteKit SSR)
- PostgreSQL via Render för databasen

## 7. Realtidsdata

**Vad ska uppdateras live:**

- Rumdata (vems tur, när man skriver, när man chattar, )
- Notifikationer (join-events, vänförfrågningar)
- Live stats (global player count, aktiva rum, player count per room)

## 8. Komponentbibliotek (frivilligt)

- shadcn-svelte

## 9. Bilduppladdning

**Var använder jag bilder:**

- Profilbilder för användare (beskärs till kvadrat, max 2MB)
- Galleri för att visa bilder i profilen (max 20 bilder/användare)

## 10. Layout groups

**Hur organiserar jag mina layout groups:**

- `(public)` — About, Login, Register, Blog (ingen auth krävs)
- `(authenticated)` — Rooms, Profiles, Gallery, Settings (kräver aktiv session)
- Annars redirect till login / rooms

## 11. Authentication tokens

**Hur hanterar jag säkra sessioner:**

- BetterAuth för session- och tokenhantering
- Session rotation vid känsliga åtgärder (lösenordsbyte etc.)

### 🛠️ Obligatoriska tekniska komponenter:

<b>Dynamisk routing</b> - Olika sidor/vyer baserat på URL\
<b>Databasmodeller</b> - Strukturerad data med Prisma\
<b>Databasrelationer</b> - Kopplingar mellan olika datatyper\
<b>Inloggning</b> - Användare kan skapa konto och logga in\
<b>Kryptering </b>- Säker hantering av lösenord och känslig data\
<b>Hosting i molnet</b> - Deploy till Render\
<b>Bilduppladdning</b> - Användare kan ladda upp bilder\
<b>Layout groups</b> - Olika layouts för olika grupper av routes.\
<b>Authentication tokens</b> - Säker session-hantering

### INSPO
1
<a href="https://discord.com/"> discord.com </a>
