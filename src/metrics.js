const config = require("./config.js");
const os = require("os");

class Metrics {
  constructor() {
    this.methodCounts = {
      GET: 0,
      POST: 0,
      PUT: 0,
      DELETE: 0,
    };
    this.totalRequests = 0;
    this.ACTIVE_USERS = 0;
    this.SUCCESSFUL_AUTH_ATTEMPTS = 0;
    this.FAILED_AUTH_ATTEMPTS = 0;
    this.PIZZAS_SOLD_SUCCESS = 0;
    this.PIZZAS_SOLD_FAILED = 0;
    this.PIZZAS_REVENUE = 0;
    this.PIZZA_CREATION_LATENCY = [];
    this.SERVICE_ENDPOINT_LATENCY = [];

    const timer = setInterval(() => {
      // Reset arrays after sending metrics to prevent memory leaks
      this.PIZZA_CREATION_LATENCY = [];
      this.SERVICE_ENDPOINT_LATENCY = [];

      this.sendRequestMetricToGrafana("request", "all", "total", this.totalRequests);
      Object.entries(this.methodCounts).forEach(([method, count]) => {
        this.sendRequestMetricToGrafana("request", method.toLowerCase(), "total", count);
      });

      this.sendMetricToGrafana("users", "active", this.ACTIVE_USERS);
      this.sendMetricToGrafana("auth", "success", this.SUCCESSFUL_AUTH_ATTEMPTS);
      this.sendMetricToGrafana("auth", "failed", this.FAILED_AUTH_ATTEMPTS);
      this.sendMetricToGrafana("pizzas", "sold", this.PIZZAS_SOLD_SUCCESS);
      this.sendMetricToGrafana("pizzas", "failed", this.PIZZAS_SOLD_FAILED);
      this.sendMetricToGrafana("pizzas", "revenue", this.PIZZAS_REVENUE);

      const avgPizzaLatency = this.getAveragePizzaCreationLatency();
      const avgServiceLatency = this.getAverageServiceEndpointLatency();

      this.sendMetricToGrafana("pizzas", "latency", avgPizzaLatency);
      this.sendMetricToGrafana("service", "latency", avgServiceLatency);

      this.sendMetricToGrafana("cpu", "usage", this.getCpuUsagePercentage());
      this.sendMetricToGrafana("memory", "usage", this.getMemoryUsagePercentage());
    }, 10000);
    timer.unref();
  }

  incrementRequests(req, res, next) {
    const httpMethod = req.method;
    this.totalRequests++;
    if (httpMethod && this.methodCounts[httpMethod.toUpperCase()] !== undefined) {
      this.methodCounts[httpMethod.toUpperCase()]++;
    }
    next();
  }

  sendRequestMetricToGrafana(metricPrefix, httpMethod, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source},method=${httpMethod} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana for method:", metric);
        } else {
          // console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }

  sendMetricToGrafana(metricPrefix, metricName, metricValue) {
    const metric = `${metricPrefix},source=${config.metrics.source} ${metricName}=${metricValue}`;

    fetch(`${config.metrics.url}`, {
      method: "post",
      body: metric,
      headers: { Authorization: `Bearer ${config.metrics.userId}:${config.metrics.apiKey}` },
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to push metrics data to Grafana:", metric);
        } else {
          // console.log(`Pushed ${metric}`);
        }
      })
      .catch((error) => {
        console.error("Error pushing metrics:", error);
      });
  }

  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return cpuUsage.toFixed(2) * 100;
  }

  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return memoryUsage.toFixed(2);
  }

  incrementActiveUsers() {
    this.ACTIVE_USERS++;
  }

  decrementActiveUsers() {
    this.ACTIVE_USERS--;
  }

  incrementSuccessfulAuthAttempts() {
    this.SUCCESSFUL_AUTH_ATTEMPTS++;
  }

  incrementFailedAuthAttempts() {
    this.FAILED_AUTH_ATTEMPTS++;
  }

  incrementPizzasSoldSuccess() {
    this.PIZZAS_SOLD_SUCCESS++;
  }

  incrementPizzasSoldFailed() {
    this.PIZZAS_SOLD_FAILED++;
  }

  incrementPizzasRevenue(amount) {
    this.PIZZAS_REVENUE += amount;
  }

  incrementPizzaCreationLatency(latency) {
    this.PIZZA_CREATION_LATENCY.push(latency);
  }

  getAveragePizzaCreationLatency() {
    if (this.PIZZA_CREATION_LATENCY.length > 0) {
      return (
        this.PIZZA_CREATION_LATENCY.reduce((a, b) => a + b, 0) / this.PIZZA_CREATION_LATENCY.length
      );
    }
    return 0;
  }

  incrementServiceEndpointLatency(latency) {
    this.SERVICE_ENDPOINT_LATENCY.push(latency);
  }

  getAverageServiceEndpointLatency() {
    if (this.SERVICE_ENDPOINT_LATENCY.length > 0) {
      return (
        this.SERVICE_ENDPOINT_LATENCY.reduce((a, b) => a + b, 0) /
        this.SERVICE_ENDPOINT_LATENCY.length
      );
    }
    return 0;
  }
}

const metrics = new Metrics();
module.exports = metrics;
