/**
 * 此文件包含操作文件、目录的常用工具方法。
 * This file contains common utility methods manipulating files and directories.
 */

import path from 'path'
import fsExtra from 'fs-extra'
import Promise from 'bluebird'

const fs = Promise.promisifyAll(fsExtra)

/**
 * 验证文件或目录是否可访问。
 * Verify that the file or directory is accessible.
 */
function exists(file) {
  return new Promise((resolve) => {
    fs.access(file, fs.F_OK, err => resolve(!err))
  })
}

/**
 * 删除指定的文件或目录。
 * Delete the specified file or directory.
 */
function remove(file) {
  return fs.removeAsync(file)
}

/**
 * 确保指定目录存在，如果目录不存在会自动创建。
 * Ensure that the specified directory exists, if the directory does not exist
 * it will be created automatically.
 */
function ensureDir(dir) {
  return fs.ensureDirAsync(dir)
}

/**
 * 确保指定文件存在，如果文件不存在会自动创建。
 * Be sure to specify the file exists, if the file does not exist will be
 * created automatically.
 */
function ensureFile(file) {
  return fs.ensureFileAsync(file)
}

/**
 * 从指定的文件数据。
 * Read data from the specified file.
 */
function readFile(file, encoding = 'utf8') {
  return fs.readFileAsync(file, encoding)
}

/**
 * 写数据到指定的文件，如果文件不存在会自动创建。
 * Write data to the specified file, if the file does not exist will be created
 * automatically.
 */
function writeFile(file, data) {
  return fs.outputFileAsync(file, data)
}

/**
 * 根据文件名递归查找文件，直至到最顶层目录为止。
 * Recursively find files by file name, until up to the top level directory.
 */
function searchFile(filename, dir = `.${path.sep}`) {
  const aDir = dir.endsWith(path.sep) ? dir : `${dir}${path.sep}`
  const currentPath = path.resolve(aDir, filename)
  return exists(currentPath)
    .then((isExists) => {
      if (isExists) {
        return currentPath
      }

      const nextPath = path.resolve(`${aDir}..${path.sep}`, filename)
      if (nextPath === currentPath) {
        return null
      }

      return searchFile(filename, `${aDir}..${path.sep}`)
    })
}

/**
 * 获取目录下唯一的文件名，如果同名文件已经存在，则自动添加数字编号。
 * 返回文件名的全路径，例如：/test/foo-1.txt，/test/bar-2.txt。
 *
 * Get a unique file name directory, if the file already exists with the same
 * name, it is automatically added figures.
 * It returns the full path of the file name, for example:
 * /test/foo-1.txt,/test/bar-2.txt.
 */
function uniquePath(file) {
  const absolutePath = path.resolve(file)
  const dirname = path.dirname(absolutePath)
  const extname = path.extname(absolutePath)
  const basename = path.basename(file, extname)
  const filenameRegex = new RegExp(`${basename}-(\\d+)${extname}`)

  return exists(absolutePath)
    .then(exist => (exist ? fs.readdirAsync(dirname) : absolutePath))
    .then((result) => {
      if (Array.isArray(result) && result.length) {
        let maxSerial = 0

        const files = result.filter(name => filenameRegex.test(name))
          .sort((a, b) => {
            const an = a.replace(filenameRegex, '$1')
            const bn = b.replace(filenameRegex, '$1')
            return parseInt(an, 10) - parseInt(bn, 10)
          })
        if (files.length) {
          const maxSerialFilename = files[files.length - 1]
          maxSerial = parseInt(maxSerialFilename.replace(filenameRegex, '$1'), 10)
        }

        return path.join(dirname, `${basename}-${maxSerial + 1}${extname}`)
      }

      return absolutePath
    })
}

export default {
  fs,
  exists,
  remove,
  ensureDir,
  ensureFile,
  readFile,
  writeFile,
  searchFile,
  uniquePath,
}
