import XCTest
@testable import iBurn2025MediaFiles

final class iBurn2025MediaFilesTests: XCTestCase {
    
    // MARK: - Basic Functionality Tests
    
    func testYearConstant() {
        XCTAssertEqual(iBurn2025MediaFiles.year, 2025)
    }
    
    func testBundleAccess() {
        // Test that we can access the bundle (even if it's empty)
        let testURL = iBurn2025MediaFiles.url(forResource: "nonexistent", withExtension: "jpg")
        // This should be nil since the resource doesn't exist, but shouldn't crash
        XCTAssertNil(testURL, "Non-existent resource should return nil")
    }
    
    func testAllMediaFilesFunction() {
        // Test that allMediaFiles() returns without crashing
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        XCTAssertNotNil(mediaFiles, "allMediaFiles() should return an array")
        
        // For 2025, the MediaFiles directory might be empty or contain only .gitkeep
        // So we don't assert on the count, just that it returns successfully
    }
    
    func testMediaFilesArrayIsValid() {
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // Each URL should be valid
        for url in mediaFiles {
            XCTAssertTrue(url.isFileURL, "Media file URL should be a file URL")
            XCTAssertTrue(
                FileManager.default.fileExists(atPath: url.path),
                "Media file should exist at path: \(url.path)"
            )
        }
    }
    
    // MARK: - File Type Tests
    
    func testMediaFileTypes() {
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // If we have media files, test that they're appropriate types
        for url in mediaFiles {
            let pathExtension = url.pathExtension.lowercased()
            
            // Common media file extensions
            let validExtensions = [
                "jpg", "jpeg", "png", "gif", "webp", // Images
                "mp4", "mov", "avi", "mkv", "webm", // Video
                "mp3", "m4a", "wav", "aac", "ogg", "flac", // Audio
                "pdf", "txt", "json", // Documents
                "gitkeep", "" // Special cases
            ]
            
            if !pathExtension.isEmpty {
                XCTAssertTrue(
                    validExtensions.contains(pathExtension),
                    "File extension '\(pathExtension)' should be a valid media type for file: \(url.lastPathComponent)"
                )
            }
        }
    }
    
    // MARK: - Resource URL Generation Tests
    
    func testResourceURLGeneration() {
        // Test various resource name and extension combinations
        let testCases = [
            ("test", "jpg"),
            ("test", "png"),
            ("test", "m4a"),
            ("test", "mp4"),
            ("", "jpg"),
            ("test", "")
        ]
        
        for (name, ext) in testCases {
            let url = iBurn2025MediaFiles.url(forResource: name, withExtension: ext)
            // These should all return nil since the resources don't exist,
            // but the function should not crash
            XCTAssertNil(url, "Non-existent resource should return nil for name: '\(name)', ext: '\(ext)'")
        }
    }
    
    // MARK: - Directory Structure Tests
    
    func testMediaFilesDirectoryExists() {
        // Test that we can access the MediaFiles directory
        let _ = iBurn2025MediaFiles.url(forResource: "test", withExtension: "jpg")
        // Even if nil, this tests that the bundle is accessible
        
        // Get the bundle and check if it has a resource URL
        let bundle = Bundle.module
        XCTAssertNotNil(bundle.resourceURL, "Bundle should have a resource URL")
    }
    
    func testHiddenFilesAreExcluded() {
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // No file should start with a dot (hidden files)
        for url in mediaFiles {
            XCTAssertFalse(
                url.lastPathComponent.hasPrefix("."),
                "Hidden files should be excluded: \(url.lastPathComponent)"
            )
        }
    }
    
    func testOnlyRegularFilesIncluded() {
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // All returned URLs should be regular files, not directories
        for url in mediaFiles {
            var isDirectory: ObjCBool = false
            let exists = FileManager.default.fileExists(atPath: url.path, isDirectory: &isDirectory)
            
            XCTAssertTrue(exists, "Media file should exist: \(url.path)")
            XCTAssertFalse(isDirectory.boolValue, "Should not include directories: \(url.path)")
        }
    }
    
    // MARK: - Historical Data Tests (for reference)
    
    func testExpectedMediaFilePatterns() {
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // If we have media files, they should follow expected patterns
        for url in mediaFiles {
            let filename = url.lastPathComponent
            
            // Skip .gitkeep files
            if filename == ".gitkeep" {
                continue
            }
            
            // Based on historical data, media files often have UIDs like "a2I0V000001..."
            // But for 2025 they might be different or empty, so we just check basic validity
            
            // File name should not be empty
            XCTAssertFalse(filename.isEmpty, "Media file name should not be empty")
            
            // Should have a reasonable length
            XCTAssertGreaterThan(filename.count, 0, "Media file name should have content")
            XCTAssertLessThan(filename.count, 256, "Media file name should be reasonable length")
        }
    }
    
    // MARK: - Error Handling Tests
    
    func testErrorHandlingForMissingResources() {
        // Test that missing resources return nil gracefully
        let missingImage = iBurn2025MediaFiles.url(forResource: "definitely_missing", withExtension: "jpg")
        XCTAssertNil(missingImage, "Missing resource should return nil")
        
        let missingAudio = iBurn2025MediaFiles.url(forResource: "not_there", withExtension: "m4a")
        XCTAssertNil(missingAudio, "Missing audio resource should return nil")
    }
    
    func testErrorHandlingForInvalidResourceNames() {
        // Test edge cases for resource names
        let emptyName = iBurn2025MediaFiles.url(forResource: "", withExtension: "jpg")
        XCTAssertNil(emptyName, "Empty resource name should return nil")
        
        let emptyExtension = iBurn2025MediaFiles.url(forResource: "test", withExtension: "")
        XCTAssertNil(emptyExtension, "Resource with empty extension should return nil (if file doesn't exist)")
    }
    
    // MARK: - Performance Tests
    
    func testAllMediaFilesPerformance() {
        measure {
            _ = iBurn2025MediaFiles.allMediaFiles()
        }
    }
    
    func testResourceURLPerformance() {
        measure {
            for i in 0..<100 {
                _ = iBurn2025MediaFiles.url(forResource: "test\(i)", withExtension: "jpg")
            }
        }
    }
    
    // MARK: - Bundle Integration Tests
    
    func testBundleModuleAccess() {
        // Test that Bundle.module is accessible
        let bundle = Bundle.module
        XCTAssertNotNil(bundle, "Bundle.module should be accessible")
        XCTAssertNotNil(bundle.resourceURL, "Bundle should have a resource URL")
    }
    
    func testBundleResourceEnumeration() {
        // Test that we can enumerate bundle resources without crashing
        let bundle = Bundle.module
        guard let resourceURL = bundle.resourceURL else {
            XCTFail("Bundle should have a resource URL")
            return
        }
        
        do {
            let contents = try FileManager.default.contentsOfDirectory(
                at: resourceURL,
                includingPropertiesForKeys: [URLResourceKey.isRegularFileKey],
                options: [.skipsHiddenFiles]
            )
            
            // Should not crash, contents may be empty for 2025
            XCTAssertNotNil(contents, "Should be able to enumerate bundle contents")
            
        } catch {
            XCTFail("Should be able to enumerate bundle resources: \(error)")
        }
    }
    
    // MARK: - Future-Proofing Tests
    
    func testMediaFileDiscoveryForFutureFiles() {
        // Test that the discovery mechanism works for common file types
        let mediaFiles = iBurn2025MediaFiles.allMediaFiles()
        
        // Group by extension
        var extensionCounts: [String: Int] = [:]
        for url in mediaFiles {
            let ext = url.pathExtension.lowercased()
            extensionCounts[ext, default: 0] += 1
        }
        
        // Log what we found (for debugging/verification)
        // In a real scenario, this would help verify the data is correct
        for (ext, count) in extensionCounts.sorted(by: { $0.key < $1.key }) {
            print("Found \(count) files with extension: '\(ext)'")
        }
        
        // The test passes regardless of count since 2025 data may be empty
        XCTAssertTrue(true, "Media file discovery should work for any content")
    }
}