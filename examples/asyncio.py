import asyncio

async def task(name, delay):
    await asyncio.sleep(delay)
    return f"{name} finished"

results = await asyncio.gather(task("first", 0.1), task("second", 0.2))
print("\n".join(results))
