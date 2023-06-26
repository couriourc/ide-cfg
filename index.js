const fs = require('fs');
const {join, dirname, basename, normalize} = require('path');


async function copyFiles(oldPath, newPath) {
    // 判断路径是否存在，有一个不存在则抛出错误
    oldPath = normalize(oldPath);
    newPath = normalize(newPath);
    console.log(oldPath, newPath);
    if (!fs.existsSync(oldPath) || !fs.existsSync(newPath)) {
        mkdirSync(newPath);
    }
    const oldFile = fs.lstatSync(oldPath);
    const newFile = fs.lstatSync(newPath);

    // 如果 oldPath 是文件，则直接复制 oldPath
    if (oldFile.isFile()) {
        // 需要考虑 newPath 是文件还是目录
        // 如果是文件路径，则可以直接使用进行复制
        // 如果是目录路径，则需要拼接上 oldPath 的文件名
        if (newFile.isDirectory()) {
            newPath = join(newPath, basename(oldPath));
        }
        fs.copyFileSync(oldPath, newPath);
        return;
    }

    // 如果 oldPath 是目录，则 newPath 应该也使目录
    // 若 newPath 目标路径是文件，则默认复制到文件的目录下
    if (newFile.isFile()) {
        console.warn(new Error(' 参数 2 应为路径。'));
        newPath = dirname(newPath);
    }

    if (oldFile.isDirectory()) {
        const files = fs.readdirSync(oldPath);
        if (files && files.length) {
            // 遍历目录下的所有文件，并将 fileName 拼接上目录路径
            for (const fileName of files) {
                const oPath = join(oldPath, fileName);
                const oFile = fs.lstatSync(oPath);
                // 如果拼接后的路径为文件，则直接复制
                if (oFile.isFile()) {
                    // 当然，新文件也需要拼接上 fileName
                    const newFile = join(newPath, fileName);
                    fs.copyFileSync(oPath, newFile);
                }
                // 如果是目录，则递归调用 moveFiles
                if (oFile.isDirectory()) {
                    const oldDir = join(oldPath, fileName);
                    const newDir = join(newPath, fileName);
                    // 需要判断拼接后的 newDir 是否存在此目录，如果不存在则创建
                    if (!fs.existsSync(newDir)) {
                        await fs.mkdirSync(newDir);
                    }
                    await copyFiles(oldDir, newDir);
                }
            }
        }
    }
}

const ws = require('windows-shortcuts');
const {mkdirSync} = require('fs');

function lnkParser(item, cb) {
    item = join('src', item);
    return new Promise((resolve) => {
        ws.query(item, (err, lnk) => {
            if (err) return;
            const config = /(.*)\.lnk$/.exec(basename(item))[1];
            return resolve([lnk.target, join(__dirname, 'dist', config)]);
        });
    }).then(cb);
}

fs.readdirSync('src')
    .filter(file => /\.lnk$/.test(file))
    .map(lnk => lnkParser(lnk, (file) => copyFiles(...file)));


