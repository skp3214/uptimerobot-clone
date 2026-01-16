import { Socket } from "net"

async function checkPort(host: string, port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new Socket()
        socket.setTimeout(5000)

        socket.on("connect", () => {
            socket.destroy()
            resolve(true)
        })

        socket.on("timeout", () => {
            socket.destroy()
            resolve(false)
        })

        socket.on("error", () => {
            socket.destroy()
            resolve(false)
        })

        socket.connect(port, host)
    })
}

export async function checkMonitorHealth(
    monitor: { url: string; type?: string; keyword?: string; port?: number }
): Promise<{
    status: "up" | "down"
    responseTime: number
    statusCode: number
}> {
    const startTime = Date.now()
    const { url, type = "http", keyword, port } = monitor

    try {
        let status: "up" | "down" = "down"
        let statusCode = 0

        if (type === "port" && port) {
            // Extract hostname from URL or use it directly if it's just a hostname
            let hostname = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "")
            // Remove port from hostname if present
            hostname = hostname.split(":")[0]

            const isOpen = await checkPort(hostname, port)
            status = isOpen ? "up" : "down"
            statusCode = isOpen ? 200 : 0
        } else if (type === "ping") {
            // Since ICMP ping is often restricted, we'll do a simple HTTP HEAD or TCP connect
            // If URL starts with http, use fetch, otherwise try TCP
            if (url.startsWith("http")) {
                const response = await fetch(url, { method: "HEAD", redirect: "follow" })
                status = "up" // If we get a response, it's reachable, regardless of 404/500
                statusCode = response.status
            } else {
                // Try port 80 or 443
                let hostname = url.split(":")[0]
                let targetPort = url.includes(":") ? parseInt(url.split(":")[1]) : 80
                const isOpen = await checkPort(hostname, targetPort)
                status = isOpen ? "up" : "down"
                statusCode = isOpen ? 200 : 0
            }
        } else if (type === "keyword" && keyword) {
            const response = await fetch(url, { method: "GET", redirect: "follow" })
            statusCode = response.status
            if (response.ok) {
                const text = await response.text()
                // Case-insensitive search
                const lowerText = text.toLowerCase()
                const lowerKeyword = keyword.toLowerCase()
                status = lowerText.includes(lowerKeyword) ? "up" : "down"
                if (status === "down") statusCode = 409 // Conflict/Keyword Missing
            } else {
                status = "down"
            }
        } else {
            // Default HTTP check
            const response = await fetch(url, { method: "HEAD", redirect: "follow" })
            status = response.ok ? "up" : "down"
            statusCode = response.status
        }

        const responseTime = Date.now() - startTime

        return {
            status,
            responseTime,
            statusCode,
        }
    } catch (error) {
        return {
            status: "down",
            responseTime: Date.now() - startTime,
            statusCode: 0,
        }
    }
}
