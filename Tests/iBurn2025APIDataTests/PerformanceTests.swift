import XCTest
@testable import iBurn2025APIData

final class PerformanceTests: XCTestCase {
    
    // MARK: - Resource Loading Performance
    
    func testBundleAccessPerformance() {
        measure {
            for _ in 0..<1000 {
                _ = iBurn2025APIData.bundle
            }
        }
    }
    
    func testURLGenerationPerformance() {
        measure {
            for _ in 0..<1000 {
                for dataFile in iBurn2025APIData.DataFile.allCases {
                    _ = dataFile.url
                }
            }
        }
    }
    
    func testDataLoadingPerformance() {
        measure {
            for dataFile in iBurn2025APIData.DataFile.allCases {
                do {
                    _ = try dataFile.loadData()
                } catch {
                    XCTFail("Failed to load \(dataFile.rawValue): \(error)")
                }
            }
        }
    }
    
    func testJSONParsingPerformance() {
        measure {
            for dataFile in iBurn2025APIData.DataFile.allCases {
                do {
                    let data = try dataFile.loadData()
                    _ = try JSONSerialization.jsonObject(with: data, options: [])
                } catch {
                    XCTFail("Failed to parse \(dataFile.rawValue): \(error)")
                }
            }
        }
    }
    
    // MARK: - Individual File Performance
    
    func testArtDataLoadingPerformance() {
        measure {
            do {
                _ = try iBurn2025APIData.DataFile.art.loadData()
            } catch {
                XCTFail("Failed to load art data: \(error)")
            }
        }
    }
    
    func testCampDataLoadingPerformance() {
        measure {
            do {
                _ = try iBurn2025APIData.DataFile.camp.loadData()
            } catch {
                XCTFail("Failed to load camp data: \(error)")
            }
        }
    }
    
    func testEventDataLoadingPerformance() {
        measure {
            do {
                _ = try iBurn2025APIData.DataFile.event.loadData()
            } catch {
                XCTFail("Failed to load event data: \(error)")
            }
        }
    }
    
    func testSmallFileLoadingPerformance() {
        // Test loading smaller files (update, credits, dates_info, points)
        measure {
            do {
                _ = try iBurn2025APIData.DataFile.update.loadData()
                _ = try iBurn2025APIData.DataFile.credits.loadData()
                _ = try iBurn2025APIData.DataFile.datesInfo.loadData()
                _ = try iBurn2025APIData.DataFile.points.loadData()
            } catch {
                XCTFail("Failed to load small files: \(error)")
            }
        }
    }
    
    // MARK: - JSON Processing Performance
    
    func testArtJSONParsingPerformance() {
        guard let data = try? iBurn2025APIData.DataFile.art.loadData() else {
            XCTFail("Could not load art data for performance test")
            return
        }
        
        measure {
            do {
                _ = try JSONSerialization.jsonObject(with: data, options: [])
            } catch {
                XCTFail("Failed to parse art JSON: \(error)")
            }
        }
    }
    
    func testCampJSONParsingPerformance() {
        guard let data = try? iBurn2025APIData.DataFile.camp.loadData() else {
            XCTFail("Could not load camp data for performance test")
            return
        }
        
        measure {
            do {
                _ = try JSONSerialization.jsonObject(with: data, options: [])
            } catch {
                XCTFail("Failed to parse camp JSON: \(error)")
            }
        }
    }
    
    func testEventJSONParsingPerformance() {
        guard let data = try? iBurn2025APIData.DataFile.event.loadData() else {
            XCTFail("Could not load event data for performance test")
            return
        }
        
        measure {
            do {
                _ = try JSONSerialization.jsonObject(with: data, options: [])
            } catch {
                XCTFail("Failed to parse event JSON: \(error)")
            }
        }
    }
    
    // MARK: - Memory Usage Tests
    
    func testMemoryUsageForLargeFiles() {
        // Test that loading large files doesn't cause excessive memory usage
        
        let initialMemory = getMemoryUsage()
        
        do {
            // Load the largest files
            let artData = try iBurn2025APIData.DataFile.art.loadData()
            let campData = try iBurn2025APIData.DataFile.camp.loadData()
            let eventData = try iBurn2025APIData.DataFile.event.loadData()
            
            // Parse them
            _ = try JSONSerialization.jsonObject(with: artData, options: [])
            _ = try JSONSerialization.jsonObject(with: campData, options: [])
            _ = try JSONSerialization.jsonObject(with: eventData, options: [])
            
            let finalMemory = getMemoryUsage()
            let memoryIncrease = finalMemory - initialMemory
            
            // Memory increase should be reasonable (less than 100MB for all data)
            XCTAssertLessThan(memoryIncrease, 100 * 1024 * 1024, 
                             "Memory usage should be reasonable: \(memoryIncrease) bytes")
            
        } catch {
            XCTFail("Failed to load data for memory test: \(error)")
        }
    }
    
    func testRepeatedLoadingMemoryUsage() {
        // Test that repeated loading doesn't cause memory leaks
        
        let initialMemory = getMemoryUsage()
        
        // Load and discard data multiple times
        for _ in 0..<10 {
            do {
                for dataFile in iBurn2025APIData.DataFile.allCases {
                    let data = try dataFile.loadData()
                    _ = try JSONSerialization.jsonObject(with: data, options: [])
                }
            } catch {
                XCTFail("Failed to load data in iteration: \(error)")
            }
        }
        
        let finalMemory = getMemoryUsage()
        let memoryIncrease = finalMemory - initialMemory
        
        // Memory increase should be minimal after repeated loading
        XCTAssertLessThan(memoryIncrease, 50 * 1024 * 1024, 
                         "Repeated loading should not cause significant memory increase: \(memoryIncrease) bytes")
    }
    
    // MARK: - Concurrent Access Performance
    
    func testConcurrentDataLoading() {
        measure {
            let group = DispatchGroup()
            let queue = DispatchQueue(label: "test.concurrent", attributes: .concurrent)
            
            for dataFile in iBurn2025APIData.DataFile.allCases {
                group.enter()
                queue.async {
                    do {
                        _ = try dataFile.loadData()
                    } catch {
                        XCTFail("Failed to load \(dataFile.rawValue) concurrently: \(error)")
                    }
                    group.leave()
                }
            }
            
            group.wait()
        }
    }
    
    func testConcurrentJSONParsing() {
        // Pre-load all data
        let dataFiles: [(iBurn2025APIData.DataFile, Data)] = iBurn2025APIData.DataFile.allCases.compactMap { dataFile in
            guard let data = try? dataFile.loadData() else { return nil }
            return (dataFile, data)
        }
        
        measure {
            let group = DispatchGroup()
            let queue = DispatchQueue(label: "test.concurrent.parsing", attributes: .concurrent)
            
            for (dataFile, data) in dataFiles {
                group.enter()
                queue.async {
                    do {
                        _ = try JSONSerialization.jsonObject(with: data, options: [])
                    } catch {
                        XCTFail("Failed to parse \(dataFile.rawValue) concurrently: \(error)")
                    }
                    group.leave()
                }
            }
            
            group.wait()
        }
    }
    
    // MARK: - File Size Performance Correlation
    
    func testLoadingTimeVsFileSize() {
        // Test that loading time correlates reasonably with file size
        
        var fileSizeToTime: [(String, Int, TimeInterval)] = []
        
        for dataFile in iBurn2025APIData.DataFile.allCases {
            do {
                let startTime = CFAbsoluteTimeGetCurrent()
                let data = try dataFile.loadData()
                let endTime = CFAbsoluteTimeGetCurrent()
                
                let loadTime = endTime - startTime
                fileSizeToTime.append((dataFile.rawValue, data.count, loadTime))
                
            } catch {
                XCTFail("Failed to load \(dataFile.rawValue): \(error)")
            }
        }
        
        // Sort by file size
        fileSizeToTime.sort { $0.1 < $1.1 }
        
        // Log the results for analysis
        for (filename, size, time) in fileSizeToTime {
            print("File: \(filename), Size: \(size) bytes, Load time: \(time) seconds")
        }
        
        // Basic sanity check: largest file should not take excessively longer than smallest
        if fileSizeToTime.count >= 2 {
            let smallest = fileSizeToTime.first!
            let largest = fileSizeToTime.last!
            
            // Time ratio should not be more than 1000x the size ratio
            let sizeRatio = Double(largest.1) / Double(smallest.1)
            let timeRatio = largest.2 / smallest.2
            
            XCTAssertLessThan(timeRatio, sizeRatio * 1000, 
                             "Loading time should scale reasonably with file size")
        }
    }
    
    // MARK: - Helper Methods
    
    private func getMemoryUsage() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size) / 4
        
        let result = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_, task_flavor_t(MACH_TASK_BASIC_INFO), $0, &count)
            }
        }
        
        return result == KERN_SUCCESS ? info.resident_size : 0
    }
}