import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import parse from 'parse-git-config'
import { consola } from 'consola'
import pc from 'picocolors'
import terminalColumns from 'terminal-columns'

const WORK_DIR = process.cwd()

export default async function run() {
	try {
		await fs.access(join(WORK_DIR, '.git'))
		const headContent = await fs.readFile(
			join(WORK_DIR, '.git', 'HEAD'),
			'utf8',
		)
		const current = headContent.replace('ref: refs/heads/', '').trim()
		const heads = await fs.readdir(join(WORK_DIR, '.git', 'refs', 'heads'))
		const localRemotes = await fs.readdir(
			join(WORK_DIR, '.git', 'refs', 'remotes', 'origin'),
		)

		const config = parse.sync({ cwd: WORK_DIR })
		const remoteUrl = config['remote "origin"'].url
		const remoteRepo = remoteUrl
			.split('.git')[0]
			.replace(/^(https?:\/\/)?(github.com\/)?/, '')

		const response = await fetch(
			`https://api.github.com/repos/${remoteRepo}/branches`,
		)

		const remotes = new Set(
			((await response.json()) as { name: string }[]).map((item) => item.name),
		)

		const allBranches = new Set([...heads, ...localRemotes])

		// Create table data
		const tableData = [
			[
        pc.blue(pc.bold('Branch')),
				pc.blue(pc.bold('Local')),
				pc.blue(pc.bold('Local Remote')),
				pc.blue(pc.bold('Remote')),
			],
		]

		for (const branch of allBranches) {
			const isLocal = heads.includes(branch)
			const isLocalRemote = localRemotes.includes(branch)
			const isRemote = remotes.has(branch)

			tableData.push([
        branch,
				isLocal ? '✅' : '❌',
				isLocalRemote ? '✅' : '❌',
				isRemote ? '✅' : '❌',
			])
		}

		// Render table
		const tableString = terminalColumns(tableData, {
      columns: [
          20,
          20,
          20,
          20,
      ]
  })
		console.log(tableString)
	} catch (error) {
		consola.error(error)
	}
}
