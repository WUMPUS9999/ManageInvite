import i18next from 'i18next';
import Backend from 'i18next-fs-backend'
import path from 'path';
import { promises } from 'fs';

async function walkDirectory (dir: string, namespaces: string[] = [], folderName = "") {
    const files = await promises.readdir(dir);

    const languages = [];
    for (const file of files) {
        const stat = await promises.stat(path.join(dir, file));
        if (stat.isDirectory()) {
            const isLanguage = file.includes("-");
            if (isLanguage) languages.push(file);

            const folder = await walkDirectory(
                path.join(dir, file),
                namespaces,
                isLanguage ? "" : `${file}/`
            );

            // eslint-disable-next-line no-param-reassign
            namespaces = folder.namespaces;
        } else {
            namespaces.push(`${folderName}${file.substr(0, file.length - 5)}`);
        }
    }

    return { namespaces: [...new Set(namespaces)], languages };
}

export default async () => {
    const { namespaces, languages } = await walkDirectory(
        path.resolve(__dirname, "../i18n/")
    );

    i18next.use(Backend);

    await i18next.init({
        backend: {
            jsonIndent: 2,
            loadPath: path.resolve(__dirname, "../i18n/{{lng}}/{{ns}}.json")
        },
        debug: false,
        fallbackLng: "en-US",
        initImmediate: false,
        interpolation: { escapeValue: false },
        load: "all",
        ns: namespaces,
        preload: languages
    });

    return new Map(languages.map(item => [item, i18next.getFixedT(item)]));
};
